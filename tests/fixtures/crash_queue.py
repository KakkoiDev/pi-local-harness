"""Intentional hard exit in a caller-supplied scratch folder; test subprocess only."""
from pathlib import Path
import os
import sys
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from harness.markdown_records import write_record
from harness.work_queue import WorkQueue

root=Path(sys.argv[1]);stage=sys.argv[2]
if stage in ('before_replace','after_replace'):
    path=root/'record.md';write_record(path,{'revision':1},'old')
    replace=Path.replace
    def crash_replace(path,target):
        if stage=='after_replace':replace(path,target)
        os._exit(79)
    with patch.object(Path,'replace',crash_replace):
        write_record(path,{'revision':2},'new')
else:
    def execute(job,emit):
        with (root/'effects.txt').open('a') as stream:stream.write('effect\n')
        if stage=='effect':os._exit(79)
    queue=WorkQueue(root/'queue.json',execute,start=False)
    queue.add('one','chat-one',{'message':'first'})
    queue.add('two','chat-two',{'message':'second'})
    if stage=='claimed':
        if not queue.claim(queue.jobs[0]):raise RuntimeError('claim failed')
    elif stage in ('effect','completed'):queue.run_one()
    elif stage!='queued':raise ValueError('Unknown crash stage')
    os._exit(79)
