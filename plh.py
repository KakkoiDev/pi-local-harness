#!/usr/bin/env python3
"""Dedicated local harness launcher. Does not modify plain Pi's configuration."""
import json
import os
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent
DEFAULTS={'model':'ollama/gemma4:26b-mlx','effort':'high','laya_port':8000,'web_port':3000,'whisper_model':'mlx-community/whisper-base-mlx'}

def configuration(directory):
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    path=directory/'config.json'
    if not path.exists():path.write_text(json.dumps(DEFAULTS,indent=2)+'\n')
    settings={**DEFAULTS,**json.loads(path.read_text())}
    if settings['effort'] not in {'off','minimal','low','medium','high','xhigh','max'}:raise ValueError('Invalid thinking effort in config.json')
    for key in ['laya_port','web_port']:
        if not isinstance(settings[key],int) or not 0<=settings[key]<=65535:raise ValueError(f'Invalid {key}')
    if not isinstance(settings['model'],str) or '/' not in settings['model']:raise ValueError('Model must use provider/model syntax')
    return settings

def main():
    directory=Path(os.getenv('PI_AGENT_DATA',str(Path.home()/'pi-local-agent-data'))).expanduser().resolve()
    settings=configuration(directory)
    memory=directory/'AGENTS.md'
    if not memory.exists():memory.write_text((ROOT/'harness/AGENTS.md').read_text())
    provider,model=settings['model'].split('/',1)
    env={**os.environ,'PI_AGENT_DATA':str(directory),'PI_HARNESS_MEMORY':str(memory),
         'PI_WEB_MODEL':model,'PI_WEB_PROVIDER':provider,'PI_WEB_EFFORT':settings['effort']}
    for name,key in [('PI_LAYA_PORT','laya_port'),('PI_WEB_PORT','web_port'),('PI_WHISPER_MODEL','whisper_model')]:env.setdefault(name,str(settings[key]))
    os.chdir(Path.home())
    arguments=['pi','--offline','--no-extensions','--extension',str(ROOT/'.pi/extensions/local-harness.ts'),'--provider',provider,'--model',model,'--thinking',settings['effort'],*sys.argv[1:]]
    os.execvpe('pi',arguments,env)

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,json.JSONDecodeError) as error:sys.exit(f'PLH: {error}')
