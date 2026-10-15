"""Install a stable PLH package; detach only the identifiable legacy Pi integration."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import uuid

ROOT=Path(__file__).resolve().parent.parent
KEEP_BACKUPS=3

def head(source):
    try:return subprocess.run(['git','-C',str(source),'rev-parse','HEAD'],capture_output=True,text=True,check=True).stdout.strip()
    except (OSError,subprocess.CalledProcessError):return None

PAPERWORK_184 = "Chats belong to one project folder. Use its working directory and the current roadmap/task snapshots supplied with each request. Resume this project's own history; do not copy conversations into shared memory or load unrelated project folders. The harness keeps the paperwork: at your first file change it makes the request's task in tasks/ (or uses the task the request names) and its ROADMAP.md line, writes the test runs Gate sees into the task's progress, and when the change is verified (a test failed first, then passed on the final code) marks it done and commits locally. Your job is the content: code, tests, documentation, findings. Write a failing test first, then the change, then run the tests until they pass; run them without pipes or `|| true` so their exit code counts. Do not create task files, tick progress boxes or commit (Gate rule G-013). Report blockers clearly."
PAPERWORK_192 = "Chats belong to one project folder. Use its working directory and the current roadmap/task snapshots supplied with each request. Resume this project's own history; do not copy conversations into shared memory or load unrelated project folders. The harness keeps the paperwork: at your first file change it makes the request's task in tasks/ (or uses the task the request names) and its ROADMAP.md line, writes the test runs Gate sees into the task's progress, and when the change is verified (a test failed first, then passed on the final code) marks it done and commits locally. Your job is the content: code, tests, documentation, findings. Write tests for the change (before or after it: the harness checks that they fail without the change and pass with it) and run them until they pass; run them without pipes or `|| true` so their exit code counts. Do not create task files, tick progress boxes or commit (Gate rule G-013). Report blockers clearly."
PAPERWORK_BEFORE = "Chats belong to one project folder. Use its working directory and the current roadmap/task snapshots supplied with each request. Resume this project's own history; do not copy conversations into shared memory or load unrelated project folders. Keep ROADMAP.md and tasks/*.md current, mark only verified work complete, and report blockers clearly. In a folder with ROADMAP.md and tasks/, Gate allows `git commit` only after: a failing test run, the implementation, a passing test run on the final code, a newly checked task box, and a newly checked roadmap box. Run tests without pipes or `|| true` so their exit code counts. Every task file has a `Kind:` line: code (red and green), chore (green), docs, or planning (no test runs, no code changes). A commit that only adds unchecked tasks is a planning commit."


def install(prefix, agent, data, source=ROOT, commit=None):
    prefix,agent,data,source=Path(prefix).resolve(),Path(agent).resolve(),Path(data).resolve(),Path(source).resolve()
    commit=commit or head(source)
    target=prefix/'share/pi-local-harness'
    for name in ['plh','pi-local-harness']:
        link=prefix/'bin'/name
        if (link.exists() or link.is_symlink()) and (not link.is_symlink() or link.resolve()!=(target/'plh.py').resolve()):
            raise RuntimeError(f'Refusing to replace unrelated command: {link}')
    target.parent.mkdir(parents=True,exist_ok=True)
    stage=target.parent/('.plh-install-'+uuid.uuid4().hex);stage.mkdir()
    for item in ['harness','gate','.pi','js','specs','design','fonts','kit','messages']:
        shutil.copytree(ROOT/item,stage/item,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
    for item in ['plh.py','agent_api.py','index.html','chat.css','README.md','PRODUCT.md','DESIGN.md']:
        shutil.copy2(ROOT/item,stage/item)
    # plh reads this on launch to follow the checkout (see plh.py update).
    (stage/'install.json').write_text(json.dumps({'source':str(source),'commit':commit,'prefix':str(prefix),'agent':str(agent),'data':str(data)},indent=2)+'\n')
    stamp=datetime.now().strftime('%Y%m%d-%H%M%S')+'-'+uuid.uuid4().hex[:6]
    if target.exists():target.rename(target.with_name('pi-local-harness.before-'+stamp))
    stage.rename(target);(target/'plh.py').chmod(0o755)
    for old in sorted(target.parent.glob('pi-local-harness.before-*'))[:-KEEP_BACKUPS]:shutil.rmtree(old)
    binary=prefix/'bin';binary.mkdir(parents=True,exist_ok=True)
    for name in ['plh','pi-local-harness']:
        link=binary/name
        if link.exists() or link.is_symlink():
            if not link.is_symlink() or link.resolve()!=(target/'plh.py').resolve():raise RuntimeError(f'Refusing to replace unrelated command: {link}')
            link.unlink()
        link.symlink_to(target/'plh.py')
    data.mkdir(parents=True,exist_ok=True)
    sys.path.insert(0,str(ROOT));from plh import configuration
    configuration(data)
    template=(ROOT/'harness/AGENTS.md').read_text()
    if not (data/'AGENTS.md').exists():(data/'AGENTS.md').write_text(template)
    current=(data/'AGENTS.md').read_text()
    paragraph=template.split('\n\n')[-1].strip()
    previous=paragraph.replace('Markdown comment record','JSON sidecar').replace('agent_reply in the comments frontmatter array','agent_reply')
    if previous!=paragraph and previous in current:
        shutil.copy2(data/'AGENTS.md',data/('AGENTS.md.before-markdown-'+stamp))
        (data/'AGENTS.md').write_text(current.replace(previous,paragraph))
    # Plan 184: the harness does the paperwork now; the paragraph that told Pi to keep tasks and commit is replaced.
    for before in (PAPERWORK_BEFORE, PAPERWORK_184, PAPERWORK_192):  # each earlier wording of this paragraph (plan 184, task 192, task 208)
        if before in current:
            shutil.copy2(data/'AGENTS.md',data/('AGENTS.md.before-paperwork-'+stamp))
            current=current.replace(before,next(part for part in template.split('\n') if part.startswith('Chats belong to one project folder.')))
            (data/'AGENTS.md').write_text(current)
    # Keep other Pi extensions and custom settings intact.
    link=agent/'extensions/local-harness.ts'
    if link.is_symlink() and str(link.readlink()).endswith('/.pi/extensions/local-harness.ts'):
        link.rename(link.with_name('local-harness.ts.before-plh-'+stamp))
    settings_path=agent/'settings.json'
    if settings_path.exists():
        settings=json.loads(settings_path.read_text())
        owned={'defaultProvider':'ollama','defaultModel':'gemma4:26b-mlx','defaultThinkingLevel':'high'}
        if all(settings.get(key)==value for key,value in owned.items()):
            shutil.copy2(settings_path,settings_path.with_name('settings.json.before-plh-'+stamp))
            for key in owned:settings.pop(key)
            settings_path.write_text(json.dumps(settings,indent=2)+'\n')
    memory=agent/'AGENTS.md'
    if memory.exists():
        legacy=memory.read_text()
        preference='\n## Harness preferences\n\nUser preference: plain `pi` starts the local harness with `gemma4:26b-mlx` and high thinking effort. Load Whisper only when an audio file is submitted. Show question submission and message/task completion timestamps in the transcript.'
        old_template=(ROOT/'harness/legacy-AGENTS.md').read_text()
        known={value.strip() for value in [template,old_template,old_template.rstrip()+'\n'+preference]}
        if legacy.strip() in known:
            shutil.copy2(memory,data/'legacy-global-AGENTS.md')
            memory.rename(memory.with_name('AGENTS.md.before-plh-'+stamp))
    print(f'PLH: {binary}/plh\nPackage: {target}\nConfig: {data}/config.json\nPlain Pi: harness extension detached; unrelated settings preserved.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--prefix',default=str(Path.home()/'.local'));parser.add_argument('--agent-dir',default=os.getenv('PI_CODING_AGENT_DIR',str(Path.home()/'.pi/agent')));parser.add_argument('--data-dir',default=os.getenv('PI_AGENT_DATA',str(Path.home()/'pi-local-harness-data')))
    parser.add_argument('--source',default=str(ROOT),help='checkout plh follows on launch');parser.add_argument('--commit',help='commit being installed (default: HEAD of --source)')
    args=parser.parse_args();install(args.prefix,args.agent_dir,args.data_dir,args.source,args.commit)
