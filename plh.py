#!/usr/bin/env python3
"""Dedicated local harness launcher. Does not modify plain Pi's configuration."""
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from harness.model import QUALIFIED
from harness import model as models
from harness import settings as registry
DEFAULTS=registry.DEFAULTS  # every setting: harness/settings.py (task 166)

def configuration(directory):
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    path=directory/'config.json'
    if not path.exists():path.write_text(json.dumps(DEFAULTS,indent=2)+'\n')
    values=json.loads(path.read_text())
    if values.get('model',QUALIFIED)!=QUALIFIED:raise ValueError(f"The model is pinned to {QUALIFIED} in harness/model.json; remove 'model' from {path}")
    values.pop('model',None)
    settings=registry.validate(values,str(path));settings['model']=QUALIFIED
    return settings

def environment(settings):
    return registry.environment(settings)

def update():
    """Install the checkout's committed HEAD when it moved since this build; return the new commit or None.

    Uncommitted edits stay out: the repo commits each task only after its tests pass."""
    record=json.loads((ROOT/'install.json').read_text())
    source=Path(record['source'])
    git=lambda *args,**options:subprocess.run(['git','-C',str(source),*args],capture_output=True,check=True,**options)
    commit=git('rev-parse','HEAD',text=True).stdout.strip()
    if commit==record['commit']:return None
    with tempfile.TemporaryDirectory(prefix='plh-update-') as directory:
        archive=Path(directory)/'head.tar';archive.write_bytes(git('archive','--format=tar',commit).stdout)
        build=Path(directory)/'build'
        with tarfile.open(archive) as tar:tar.extractall(build,filter='data')
        subprocess.run([sys.executable,str(build/'harness/install.py'),'--prefix',record['prefix'],'--agent-dir',record['agent'],'--data-dir',record['data'],'--source',str(source),'--commit',commit],capture_output=True,text=True,check=True)
    return commit

def main():
    directory=Path(os.getenv('PI_AGENT_DATA',str(Path.home()/'pi-local-harness-data'))).expanduser().resolve()
    settings=configuration(directory)
    if sys.argv[1:2]==['setup']:  # plh setup [browser]: the toolchain, fetched once (harness/setup.py)
        sys.path.insert(0,str(ROOT));from harness import setup;sys.exit(setup.main(sys.argv[2:],directory))
    if settings['auto_update'] and (ROOT/'install.json').exists() and not os.getenv('PLH_UPDATED'):
        try:commit=update()
        except (OSError,ValueError,KeyError,tarfile.TarError,subprocess.CalledProcessError) as error:
            detail=getattr(error,'stderr',None) or error
            print(f'PLH: not updated, starting the installed build ({str(detail).strip().splitlines()[-1] if str(detail).strip() else type(error).__name__})',file=sys.stderr);commit=None
        if commit:
            print(f'PLH: updated to {commit[:7]}',file=sys.stderr)
            os.execve(sys.executable,[sys.executable,str(ROOT/'plh.py'),*sys.argv[1:]],{**os.environ,'PLH_UPDATED':commit})
    memory=directory/'AGENTS.md'
    if not memory.exists():memory.write_text((ROOT/'harness/AGENTS.md').read_text())
    # The model and thinking level chosen in the web menu bar (task 147), else harness/model.json's default and config.json's effort.
    def capabilities(model):  # None: Ollama answered and the model is not installed (effective() falls back to the default)
        try:return next((item for item in models.local_models() if item['id']==model),None)
        except OSError:return models.assumed(model)
    choice=models.effective(models.current(directory,settings['effort']),capabilities);provider,model,effort=choice['provider'],choice['model'],choice['effort']
    env={**environment(settings),**os.environ,'PI_AGENT_DATA':str(directory),'PI_HARNESS_MEMORY':str(memory),'PI_WEB_EFFORT':settings['effort'],
         'PI_HARNESS_MODEL':model,'PI_HARNESS_MODEL_THINKING':'1' if choice['thinking'] else '','PI_HARNESS_MODEL_VISION':'1' if choice['vision'] else ''}
    os.chdir(Path.home())
    arguments=['pi','--offline','--no-extensions','--extension',str(ROOT/'.pi/extensions/local-harness.ts'),'--provider',provider,'--model',model,'--thinking',effort,*sys.argv[1:]]
    os.execvpe('pi',arguments,env)

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,json.JSONDecodeError) as error:sys.exit(f'PLH: {error}')
