#!/usr/bin/env python3
"""Dedicated local harness launcher. Does not modify plain Pi's configuration."""
import json
import os
import re
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from harness.model import QUALIFIED
DEFAULTS={'effort':'high','gate_port':8000,'web_port':3000,'whisper_model':'mlx-community/whisper-base-mlx','remote_hosts':[],'remote_users':[]}

def configuration(directory):
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    path=directory/'config.json'
    if not path.exists():path.write_text(json.dumps(DEFAULTS,indent=2)+'\n')
    settings={**DEFAULTS,**json.loads(path.read_text())}
    if settings.setdefault('model',QUALIFIED)!=QUALIFIED:raise ValueError(f"The model is pinned to {QUALIFIED} in harness/model.json; remove 'model' from {path}")
    if settings['effort'] not in {'off','minimal','low','medium','high','xhigh','max'}:raise ValueError('Invalid thinking effort in config.json')
    for key in ['gate_port','web_port']:
        if not isinstance(settings[key],int) or not 0<=settings[key]<=65535:raise ValueError(f'Invalid {key}')
    for key in ['remote_hosts','remote_users']:
        if not isinstance(settings[key],list) or not all(isinstance(value,str) and re.fullmatch(r'[\w.@+-]+',value) for value in settings[key]):
            raise ValueError(f'{key} must be a list of bare names, e.g. ["mini.example.ts.net"] or ["you@example.com"]')
    if bool(settings['remote_hosts'])!=bool(settings['remote_users']):raise ValueError('Set remote_hosts and remote_users together')
    return settings

def environment(settings):
    env={'PI_WEB_EFFORT':settings['effort'],'PI_WEB_REMOTE_HOSTS':','.join(settings['remote_hosts']),'PI_WEB_REMOTE_USERS':','.join(settings['remote_users'])}
    for name,key in [('PI_GATE_PORT','gate_port'),('PI_WEB_PORT','web_port'),('PI_WHISPER_MODEL','whisper_model')]:env[name]=str(settings[key])
    return env

def main():
    directory=Path(os.getenv('PI_AGENT_DATA',str(Path.home()/'pi-local-harness-data'))).expanduser().resolve()
    settings=configuration(directory)
    memory=directory/'AGENTS.md'
    if not memory.exists():memory.write_text((ROOT/'harness/AGENTS.md').read_text())
    provider,model=settings['model'].split('/',1)
    env={**environment(settings),**os.environ,'PI_AGENT_DATA':str(directory),'PI_HARNESS_MEMORY':str(memory),'PI_WEB_EFFORT':settings['effort']}
    os.chdir(Path.home())
    arguments=['pi','--offline','--no-extensions','--extension',str(ROOT/'.pi/extensions/local-harness.ts'),'--provider',provider,'--model',model,'--thinking',settings['effort'],*sys.argv[1:]]
    os.execvpe('pi',arguments,env)

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,json.JSONDecodeError) as error:sys.exit(f'PLH: {error}')
