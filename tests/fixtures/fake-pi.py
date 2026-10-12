"""RPC boundary fixture; never used by the application."""
import json
import os
from pathlib import Path
import sys
import time
session=Path(sys.argv[sys.argv.index('--session')+1])
request=json.loads(sys.stdin.readline())
assert int(os.environ['PI_HARNESS_SHARED_PORT'])>0
session.with_suffix('.request.json').write_text(json.dumps(request))
session.with_suffix('.environment.json').write_text(json.dumps({'cwd':os.getcwd(),'args':sys.argv,'data':os.environ.get('PI_AGENT_DATA')}))
count=int(session.read_text())+1 if session.exists() else 1
session.write_text(str(count))
def emit(value):print(json.dumps(value),flush=True)
emit({'type':'agent_start'})
if request['message'].rstrip().endswith('TEST_WAIT'):
    time.sleep(60)
else:
    text=f'[CANARY] reply {count}'
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':text}})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':text}],'stopReason':'stop'}})
    emit({'type':'agent_settled'})
    sys.stdin.readline()
