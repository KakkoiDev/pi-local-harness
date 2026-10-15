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
    if scenario.get('source'):
        project.mkdir(parents=True)
        archive = subprocess.run(['git', '-C', str(ROOT), 'archive', scenario['source']['commit']], capture_output=True, check=True).stdout
        subprocess.run(['tar', '-x', '-C', str(project)], input=archive, check=True)
    else:
        shutil.copytree(Path(scenario['folder']) / 'project', project)
    git(project, 'init', '-q'); git(project, 'add', '-A')
    git(project, '-c', 'user.name=Bench', '-c', 'user.email=bench@localhost', 'commit', '-qm', 'Scenario start')
    return project


def hidden_check(scenario, project):
    """(passed, what it said): the scenario's check, which Pi never sees."""
    check = Path(scenario['folder']) / 'check'
    if (check / 'run.py').is_file():
        run = subprocess.run([sys.executable, str(check / 'run.py'), str(project), str(ROOT)], cwd=project, capture_output=True, text=True, timeout=300)
    else:
        run = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', str(check), '-p', 'test_*.py'], cwd=project, capture_output=True, text=True, timeout=300,
                             env={**os.environ, 'PYTHONPATH': str(project)})
    return run.returncode == 0, (run.stdout + run.stderr).strip()[-1500:]


def regressions(scenario, project):
    """(passed, what it said) for the scenario's own existing tests (SWE-bench's PASS_TO_PASS: nothing else broke), or
    (None, '') when it has none."""
    command = scenario.get('regression')
    if not command: return None, ''
    run = subprocess.run(command, shell=True, cwd=project, capture_output=True, text=True, timeout=600)
    return run.returncode == 0, (run.stdout + run.stderr).strip()[-800:]


def fair(scenario):
    """The check fails on the starting project and passes with the reference solution."""
    with tempfile.TemporaryDirectory() as folder:
        project = prepare(scenario, folder)
        before, kept_before = hidden_check(scenario, project), regressions(scenario, project)
        solution, patch = Path(scenario['folder']) / 'solution', Path(scenario['folder']) / 'solution.patch'
        if patch.is_file(): subprocess.run(['git', '-C', str(project), 'apply', str(patch)], check=True)  # the real fix, for history scenarios
        for path in solution.rglob('*') if solution.is_dir() else []:
            if path.is_file(): (project / path.relative_to(solution)).parent.mkdir(parents=True, exist_ok=True); shutil.copy(path, project / path.relative_to(solution))
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


def run_one(scenario, model, effort, out, extra_env=None, poll=5, log=print, level='everyday', bare=False):
    """One scenario, one result line (also returned)."""
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    folder = Path(out) / 'runs' / f"{stamp}-{scenario['id']}-{model.replace(':', '_').replace('/', '_')}"
    work = Path(tempfile.mkdtemp(prefix='pi-bench-'))
    project, data = prepare(scenario, work), work / 'data'
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
    commits = [line for line in git(project, 'log', '--format=%an\t%s', check=False).splitlines() if line.startswith('Pi Workbench\t')]
    tasks = sorted(path.name for path in (project / 'tasks').glob('*.md')) if (project / 'tasks').is_dir() else []
    answer = current.get('text', '')
    result = {
        'first_try': None,  # set below
        'time': datetime.now().astimezone().isoformat(timespec='seconds'), 'scenario': scenario['id'], 'kind': scenario.get('kind'), 'prompt_level': level, 'prompt': prompt(scenario, level), 'model': model, 'effort': effort,
        **versions(model), 'status': current.get('status', 'unknown'), 'timed_out': bool(current.get('timed_out')), 'stopped_because': current.get('progress', '') if current.get('status') != 'completed' else '',
        'mode': 'bare' if bare else 'harness', 'solved': solved, 'check': said[-300:], 'regressions': kept, 'regressions_said': kept_said[-300:] if kept is False else '',
        'resolved': solved and kept is not False, 'user_turns': user_turns, 'verified': bool(commits), 'committed': [line.split('\t', 1)[1] for line in commits],
        'not_verified_mark': 'Not verified (G-012)' in answer, 'tasks_after': tasks, 'seconds': seconds,
        'tool_calls': len(tools), 'tools_failed': sum(tool.get('status') == 'failed' for tool in tools),
        'reports': counts(reports, 'kind'), 'rules': counts([line for line in gate if line.get('phase') == 'gate' and line.get('outcome') != 'ALLOW'], 'rule'),
        'gate_checks': sum(line.get('phase') == 'gate' for line in gate), 'folder': str(folder),
    }
    result['first_try'] = result['resolved'] and not result['reports'].get('wake-up') and not result['reports'].get('recovery') and not user_turns
    folder.mkdir(parents=True, exist_ok=True)
    shutil.copytree(project, folder / 'project', ignore=shutil.ignore_patterns('.git'))
    (folder / 'git-log.txt').write_text(git(project, 'log', '--stat', '--format=%h %an %s', check=False))
    (folder / 'answer.md').write_text(answer)
    for name in ('reports.jsonl', 'gate-events.jsonl', 'services.log'):
        if (data / name).exists(): shutil.copy(data / name, folder / name)
    for record in (data / 'activity').glob('*.md') if (data / 'activity').is_dir() else []: shutil.copy(record, folder / f'request-{record.name}')
    (folder / 'result.json').write_text(json.dumps(result, indent=1, ensure_ascii=False))
    Path(out).mkdir(parents=True, exist_ok=True)
    with (Path(out) / 'results.jsonl').open('a', encoding='utf-8') as handle: handle.write(json.dumps(result, ensure_ascii=False) + '\n')
    shutil.rmtree(work, ignore_errors=True)
    return result


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
                     'refusals': round(sum(sum(line['rules'].values()) for line in lines) / n, 1)})
    return rows
