"""Run bench scenarios through a scratch workbench with the real model, and record what happened (see bench/__init__.py)."""
from datetime import datetime
import json
import re
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from statistics import median

ROOT = Path(__file__).resolve().parent.parent
SCENARIOS = ROOT / 'bench' / 'scenarios'
DONE = ('completed', 'failed', 'stopped', 'interrupted', 'cancelled')


def results_dir():
    return Path(os.getenv('PI_BENCH_DIR', str(Path(os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data'))) / 'bench')))


def scenarios(ids=()):
    found = [json.loads((folder / 'scenario.json').read_text()) | {'folder': str(folder)} for folder in sorted(SCENARIOS.iterdir()) if (folder / 'scenario.json').is_file()]
    unknown = set(ids) - {item['id'] for item in found}
    if unknown: raise ValueError(f"No scenario {', '.join(sorted(unknown))}. python3 -m bench list")
    return [item for item in found if not ids or item['id'] in ids]


def git(root, *args, check=True):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, check=check).stdout


LEVELS = ('precise', 'everyday', 'vague')


def prompt(scenario, level):
    """The prompt at a level: precise (names files and the expected result), everyday (how a person says it), vague (the
    symptom); None when the scenario has no fair prompt at that level."""
    return (scenario.get('prompts') or {}).get(level) or (scenario.get('prompt') if level == 'precise' else None)


def prepare(scenario, into):
    """The scenario's project in a fresh git repository; returns its folder. A history scenario starts from this
    repository at the commit before the person's request was done."""
    project = Path(into) / scenario['id']
    if scenario.get('starter'):
        from kit.new_project import new_project, initial_plan
        if scenario['starter'] != 'static': raise ValueError('Unknown benchmark starter')
        return new_project(project, static=True, files=initial_plan(scenario['id']))
    if scenario.get('source'):
        project.mkdir(parents=True)
        archive = subprocess.run(['git', '-C', str(ROOT), 'archive', scenario['source']['commit']], capture_output=True, check=True).stdout
        subprocess.run(['tar', '-x', '-C', str(project)], input=archive, check=True)
    else:
        shutil.copytree(Path(scenario['folder']) / 'project', project)
    git(project, 'init', '-q'); git(project, 'add', '-A')
    git(project, '-c', 'user.name=Bench', '-c', 'user.email=bench@localhost', 'commit', '-qm', 'Scenario start')
    return project


def request_commits(project, baseline):
    """Only this request's commits: a runtime starter already has a Workbench commit."""
    return [line for line in git(project, 'log', baseline + '..HEAD', '--format=%an\t%s', check=False).splitlines()
            if line.startswith('Pi Workbench\t')]


def hidden_check(scenario, project):
    """(passed, what it said): the scenario's check, which Pi never sees."""
    check = Path(scenario['folder']) / 'check'
    if (check / 'run.py').is_file():
        run = subprocess.run([sys.executable, str(check / 'run.py'), str(project), str(ROOT)], cwd=project, capture_output=True, text=True, timeout=300)
    else:
        run = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', str(check), '-p', 'test_*.py'], cwd=project, capture_output=True, text=True, timeout=300,
                             env={**os.environ, 'PYTHONPATH': str(project)})
    return run.returncode == 0, (run.stdout + run.stderr).strip()


def regressions(scenario, project):
    """(passed, what it said) for the scenario's own existing tests (SWE-bench's PASS_TO_PASS: nothing else broke), or
    (None, '') when it has none."""
    command = scenario.get('regression')
    if not command: return None, ''
    run = subprocess.run(command, shell=True, cwd=project, capture_output=True, text=True, timeout=600)
    return run.returncode == 0, (run.stdout + run.stderr).strip()


def fair(scenario):
    """The check fails on the starting project and passes with the reference solution."""
    with tempfile.TemporaryDirectory() as folder:
        project = prepare(scenario, folder)
        before, kept_before = hidden_check(scenario, project), regressions(scenario, project)
        solution, patch = Path(scenario['folder']) / 'solution', Path(scenario['folder']) / 'solution.patch'
        if patch.is_file(): subprocess.run(['git', '-C', str(project), 'apply', str(patch)], check=True)  # the real fix, for history scenarios
        for path in solution.rglob('*') if solution.is_dir() else []:
            if path.is_file(): (project / path.relative_to(solution)).parent.mkdir(parents=True, exist_ok=True); shutil.copy(path, project / path.relative_to(solution))
        for name in scenario.get('solution_trash', []):
            source = project / name
            if Path(name).is_absolute() or '..' in Path(name).parts: raise ValueError('Outside-project solution path')
            if source.exists():
                target = Path(folder) / 'Trash' / name; target.parent.mkdir(parents=True, exist_ok=True); shutil.move(source, target)
        after, kept_after = hidden_check(scenario, project), regressions(scenario, project)
    regression_ok = kept_before[0] is None or (kept_before[0] and kept_after[0])
    return {'id': scenario['id'], 'fails_at_start': not before[0], 'passes_with_solution': after[0] and bool(regression_ok),
            'said': (after[1] if not after[0] else before[1]) + ('' if regression_ok else f"\nregression tests: {kept_after[1] or kept_before[1]}")}


def versions(model):
    """The harness build, Pi, Ollama and the model's digest, for the result line."""
    def run(*command):
        try: return subprocess.run(command, capture_output=True, text=True, timeout=20).stdout.strip()
        except (OSError, subprocess.SubprocessError): return ''
    build = run('git', '-C', str(ROOT), 'rev-parse', '--short', 'HEAD') + ('-dirty' if run('git', '-C', str(ROOT), 'status', '--porcelain', '--untracked-files=no') else '')
    ollama = os.getenv('PI_OLLAMA_URL', 'http://127.0.0.1:11434')
    def get(path):
        try:
            with urllib.request.urlopen(ollama + path, timeout=5) as response: return json.load(response)
        except (OSError, ValueError): return {}
    digest = next((item.get('digest', '')[:12] for item in get('/api/tags').get('models', []) if item.get('name') == model), '')
    return {'harness': build, 'pi': run(os.getenv('PI_BINARY', 'pi'), '--version'), 'ollama': get('/api/version').get('version', ''), 'model_digest': digest}


def start_workbench(data, cwd, model, effort, extra_env=None):
    """This checkout's services with a scratch data folder and the real Pi; (process, web URL)."""
    data.mkdir(parents=True, exist_ok=True)
    (data / 'model.json').write_text(json.dumps({'model': model, 'effort': effort}))
    from harness.autonomy import set_enabled
    set_enabled(data,True,confirmed=True)  # scratch bench runs always choose recommendations
    shutil.copy(ROOT / 'harness/AGENTS.md', data / 'AGENTS.md')  # as the installer seeds a real data folder
    env = {key: value for key, value in os.environ.items() if not key.startswith(('PI_HARNESS_', 'PI_WEB_REMOTE_'))}
    env.update({'PI_AGENT_DATA': str(data), 'PI_WEB_DATA': str(data / 'chats'), 'PI_WEB_PORT': '0', 'PI_GATE_PORT': '0', 'PI_TAILSCALE': 'false',
                'PI_TRASH_DIR': str(data / 'Trash'), 'PI_WEB_CWD': str(cwd), 'PI_HARNESS_LOG_FILE': str(data / 'gate-audit.log'), **(extra_env or {})})
    process = subprocess.Popen([sys.executable, str(ROOT / 'harness/services.py')], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=open(data / 'services.log', 'w'), text=True)
    line = process.stdout.readline()
    if not line: raise RuntimeError(f"The workbench did not start: {(data / 'services.log').read_text()[-800:]}")
    return process, f"http://127.0.0.1:{json.loads(line)['web']}"


def call(url, path, body=None):
    request = urllib.request.Request(url + path, data=json.dumps(body).encode() if body is not None else None, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=30) as response: return json.load(response)


def counts(lines, key):
    found = {}
    for line in lines:
        if line.get(key): found[line[key]] = found.get(line[key], 0) + 1
    return found


def read_jsonl(path):
    try: return [json.loads(line) for line in Path(path).read_text(encoding='utf-8').splitlines() if line.strip()]
    except OSError: return []


def decision_counts(path):
    if not Path(path).is_file():return None
    result={who:0 for who in ('code','laya','person','model')}
    for line in read_jsonl(path):
        if line.get('who') in result and not line.get('abstained'):result[line['who']]+=1  # an abstention decides nothing (task 261)
    return result


def decision_share(runs):
    recorded=[line['decision_counts'] for line in runs if isinstance(line.get('decision_counts'),dict)]
    if not recorded:return 'Not recorded'
    total=sum(sum(row.get(who,0) for who in ('code','laya','person','model')) for row in recorded)
    model=sum(row.get('model',0) for row in recorded)
    return f"{100*model/total:.1f}% ({model}/{total}; {len(recorded)}/{len(runs)} runs recorded)" if total else f'— (0 decisions; {len(recorded)}/{len(runs)} runs recorded)'


def run_one(scenario, model, effort, out, extra_env=None, poll=5, log=print, level='everyday', bare=False):
    """One scenario, one result line (also returned)."""
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    folder = Path(out) / 'runs' / f"{stamp}-{scenario['id']}-{model.replace(':', '_').replace('/', '_')}"
    work = Path(tempfile.mkdtemp(prefix='pi-bench-'))
    project, data = prepare(scenario, work), work / 'data'
    baseline = git(project, 'rev-parse', 'HEAD').strip()
    build=versions(model)
    process, url = start_workbench(data, work, model, effort, {**(extra_env or {}), **({'PI_HARNESS_BARE': '1'} if bare else {})})
    started, result = time.monotonic(), {}
    try:
        registered = call(url, '/api/projects/register', {'path': str(project)})
        deadline = started + scenario.get('timeout_minutes', 30) * 60
        replies, user_turns, tools, message = list(scenario.get('replies') or []), 0, [], prompt(scenario, level)
        while True:
            job = call(url, '/api/jobs/create', {'project': registered['project'], 'message': message})
            log(f"  {scenario['id']} ({level}{', bare' if bare else ''}){' reply' if user_turns else ''}: sent to {model} ({effort}); request {job['id'][:8]}")
            while True:
                current = {item['id']: item for item in call(url, '/api/workspace')['jobs']}.get(job['id'], {})
                if current.get('status') in DONE: break
                if time.monotonic() > deadline:
                    call(url, '/api/jobs/stop', {'id': job['id']}); time.sleep(10)
                    current = {item['id']: item for item in call(url, '/api/workspace')['jobs']}.get(job['id'], current); current['timed_out'] = True; break
                time.sleep(poll)
            time.sleep(3)  # the harness's paperwork (a commit) finishes as the request ends
            current = {item['id']: item for item in call(url, '/api/workspace')['jobs']}.get(job['id'], current) | ({'timed_out': True} if current.get('timed_out') else {})
            tools += current.get('tools') or []
            # A scripted user (tau-bench's simulated user, kept deterministic): when Pi ends by asking the person something,
            # the scenario's next reply is sent, as the person would answer, up to its replies.
            asked = re.sub(r'\*\*Not verified \(G-012\):\*\*.*', '', current.get('text', ''), flags=re.S).rstrip().endswith('?')
            if current.get('status') != 'completed' or current.get('timed_out') or not asked or not replies: break
            message = replies.pop(0); user_turns += 1
    finally:
        process.terminate()
        try: process.wait(timeout=15)
        except subprocess.TimeoutExpired: process.kill()
    seconds = round(time.monotonic() - started)
    solved, said = hidden_check(scenario, project)
    kept, kept_said = regressions(scenario, project)
    reports, gate = read_jsonl(data / 'reports.jsonl'), read_jsonl(data / 'gate-events.jsonl')
    commits = request_commits(project, baseline)
    tasks = sorted(path.name for path in (project / 'tasks').glob('*.md')) if (project / 'tasks').is_dir() else []
    answer = current.get('text', '')
    result = {
        'first_try': None,  # set below
        'time': datetime.now().astimezone().isoformat(timespec='seconds'), 'scenario': scenario['id'], 'kind': scenario.get('kind'), 'prompt_level': level, 'prompt': prompt(scenario, level), 'model': model, 'effort': effort,
        **build, 'status': current.get('status', 'unknown'), 'timed_out': bool(current.get('timed_out')), 'stopped_because': current.get('progress', '') if current.get('status') != 'completed' else '',
        'mode': 'bare' if bare else 'harness', 'solved': solved, 'check': said[-300:], 'regressions': kept, 'regressions_said': kept_said[-300:] if kept is False else '',
        'resolved': solved and kept is not False, 'user_turns': user_turns, 'verified': any(not line.endswith(', not verified)') for line in commits), 'committed': [line.split('\t', 1)[1] for line in commits],
        'not_verified_mark': 'Not verified (G-012)' in answer or any(line.endswith(', not verified)') for line in commits), 'tasks_after': tasks, 'plan':planning_metrics(project,data), 'seconds': seconds,
        'tool_calls': len(tools), 'tools_failed': sum(tool.get('status') == 'failed' for tool in tools),
        'test_runs': read_jsonl(data / 'test-runs.jsonl'), 'reports': counts(reports, 'kind'), 'rules': counts([line for line in gate if line.get('phase') == 'gate' and line.get('outcome') != 'ALLOW'], 'rule'),
        'gate_checks': sum(line.get('phase') == 'gate' for line in gate), 'folder': str(folder),
        'decision_counts':decision_counts(data/'decisions.jsonl'),
        'answer_words': answer_words(answer), 'tool_repairs': sum(line.get('kind') == 'tool_call_repaired' for line in read_jsonl(data / 'decisions.jsonl')),  # task 326: terse answers; text tool calls fixed
    }
    result['first_try'] = result['resolved'] and not result['reports'].get('wake-up') and not result['reports'].get('recovery') and not user_turns
    folder.mkdir(parents=True, exist_ok=True)
    shutil.copytree(project, folder / 'project', ignore=shutil.ignore_patterns('.git'))
    (folder / 'git-log.txt').write_text(git(project, 'log', '--stat', '--format=%h %an %s', check=False))
    (folder / 'answer.md').write_text(answer)
    (folder / 'check.txt').write_text(said)
    (folder / 'regressions.txt').write_text(kept_said)
    for name in ('reports.jsonl', 'gate-events.jsonl', 'test-runs.jsonl', 'decisions.jsonl', 'services.log'):
        if (data / name).exists(): shutil.copy(data / name, folder / name)
    if (data / 'test-runs').is_dir(): shutil.copytree(data / 'test-runs', folder / 'test-runs')
    for record in (data / 'activity').glob('*.md') if (data / 'activity').is_dir() else []: shutil.copy(record, folder / f'request-{record.name}')
    (folder / 'result.json').write_text(json.dumps(result, indent=1, ensure_ascii=False))
    Path(out).mkdir(parents=True, exist_ok=True)
    with (Path(out) / 'results.jsonl').open('a', encoding='utf-8') as handle: handle.write(json.dumps(result, ensure_ascii=False) + '\n')
    shutil.rmtree(work, ignore_errors=True)
    return result


def answer_words(text):
    """Task 326: how long the final answer is, in words (the terse style should keep it short), without the harness's
    own marks (the canary, the G-012 note) that are not the model's words."""
    text = re.sub(r'\*\*Not verified \(G-012\):\*\*.*', '', text or '', flags=re.S).replace('[CANARY]', '')
    return len(text.split())


def planning_metrics(project,data):
    """Plan evidence, separate from whether the hidden app check passed."""
    from harness.autonomy import RunReports
    texts=[path.read_text(encoding='utf-8') for path in (Path(project)/'tasks').glob('*.md') if not path.name.endswith('-ready-to-publish.md')]
    texts=[text for text in texts if 'Kind: planning' not in text]
    report=RunReports(data).latest() or {}
    return {'tasks':len(texts),'done_when':sum(bool(re.search(r'^Done when:',text,re.M)) for text in texts),
            'decisions_asked':sum(item.get('question')!='Plan approval' for item in report.get('decisions',[]))}


def summary(results):
    """Per model, harness build, prompt level and mode: runs, resolved (hidden check and regressions), first try (no
    wake-up, recovery or user reply), verified by the harness, pass^k (scenarios resolved in every one of their runs,
    tau-bench), average minutes, wake-ups and refusals per run."""
    groups = {}
    for line in results: groups.setdefault((line['model'], line.get('effort', ''), line.get('harness', ''), line.get('prompt_level', 'precise'), line.get('mode', 'harness')), []).append(line)
    rows = []
    for (model, effort, build, level, mode), lines in sorted(groups.items()):
        n = len(lines)
        resolved = lambda line: line.get('resolved', line['solved'])
        by_scenario = {}
        for line in lines: by_scenario.setdefault(line['scenario'], []).append(resolved(line))
        k = min(len(runs) for runs in by_scenario.values())
        rows.append({'model': model, 'effort': effort, 'harness': build, 'prompt_level': level, 'mode': mode, 'runs': n,
                     'solved': sum(resolved(line) for line in lines), 'first_try': sum(bool(line.get('first_try')) for line in lines), 'verified': sum(line['verified'] for line in lines),
                     'pass_k': f"{sum(all(runs) for runs in by_scenario.values())}/{len(by_scenario)} (k={k})",
                     'minutes': round(sum(line['seconds'] for line in lines) / n / 60, 1), 'wake_ups': round(sum(line['reports'].get('wake-up', 0) for line in lines) / n, 1),
                     'refusals': round(sum(sum(line['rules'].values()) for line in lines) / n, 1),
                     'answer_words': median(words) if (words := [line['answer_words'] for line in lines if isinstance(line.get('answer_words'), int)]) else None,
                     'tool_repairs': round(sum(line.get('tool_repairs', 0) for line in lines) / n, 1)})
    return rows


def compare(results, model=None, level='everyday'):
    """Side by side (the "no harness vs harness" question): one row per scenario, one column per condition (mode and
    harness build), each cell the runs' outcome: ✓ resolved on the first try, ✓ resolved, ~ solved but broke the
    regression tests, ✗ not solved; with minutes. {columns, rows: [{scenario, cells: {column: text}}]}."""
    lines = [line for line in results if line.get('prompt_level', 'precise') == level and (not model or line['model'] == model)]
    column = lambda line: f"{line.get('mode', 'harness')} {line.get('harness', '')}"
    columns = sorted({column(line) for line in lines}, key=lambda name: (not name.startswith('bare'), name))
    def cell(runs):
        if not runs: return ''
        mark = lambda line: '✓' if line.get('resolved', line['solved']) else '~' if line['solved'] else '✗'
        first = sum(bool(line.get('first_try')) for line in runs)
        return ' '.join(mark(line) for line in runs) + f" {round(sum(line['seconds'] for line in runs) / len(runs) / 60)} min" + (f' ({first} first try)' if first else '')
    rows = [{'scenario': name, 'cells': {name_: cell([line for line in lines if line['scenario'] == name and column(line) == name_]) for name_ in columns}}
            for name in sorted({line['scenario'] for line in lines})]
    totals = {name: f"{sum(line.get('resolved', line['solved']) for line in lines if column(line) == name)}/{sum(column(line) == name for line in lines)}" for name in columns}
    return {'columns': columns, 'rows': rows, 'totals': totals}


def readme_table(results):
    """Everyday runs only; keep absent models visibly pending and do not mix builds into one score."""
    models=[('gemma4:e4b-mlx','Gemma 4 e4b (4B)','This Mac (Ollama)'),('qwen3.8:27b-mlx','Qwen 3.8 27B','This Mac (Ollama)'),('luna','ChatGPT Luna','OpenAI API')]
    rows=['| Model | Where it runs | Solved with harness | Solved bare | Verified and committed by harness | Median minutes (harness) | Harness build | Date | Model’s share of decisions |','|---|---|---|---|---|---|---|---|---|']
    for model,name,where in models:
        found=[item for item in results if item.get('prompt_level')=='everyday' and (item['model']==model or model=='luna' and 'luna' in item['model'].lower())]
        builds=sorted(set(item['harness'] for item in found))
        if not builds:rows.append(f'| {name} | {where} | Pending | Pending | Pending | — | — | — | Not recorded |');continue
        for build in builds:
            lines=[item for item in found if item['harness']==build];harness=[item for item in lines if item.get('mode','harness')=='harness'];bare=[item for item in lines if item.get('mode')=='bare']
            score=lambda items:f"{sum(bool(item.get('resolved',item.get('solved'))) for item in items)}/{len(items)}" if items else 'Pending'
            verified=f"{sum(bool(item.get('verified')) for item in harness)}/{len(harness)}" if harness else 'Pending'
            minutes=str(round(median(item['seconds'] for item in harness)/60,1)) if harness else '—'
            dates=', '.join(sorted(set(item['time'][:10] for item in lines)))
            rows.append(f'| {name} | {where} | {score(harness)} | {score(bare)} | {verified} | {minutes} | {build} | {dates} | {decision_share(harness)} |')
    return '\n'.join(rows)
