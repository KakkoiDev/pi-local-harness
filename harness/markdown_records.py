"""Readable Markdown records with JSON-compatible YAML frontmatter values.

Frontmatter is authoritative. The body is a human-readable summary. No YAML
library or executable document markup is required.
"""
import json
from pathlib import Path
import uuid

def read_record(path):
    text=Path(path).read_text(encoding='utf-8')
    if not text.startswith('---\n'):raise ValueError(f'Missing frontmatter: {path}')
    header=text.split('\n---\n',1)[0][4:]
    return {key:json.loads(value.strip()) for key,value in (line.split(':',1) for line in header.splitlines() if line.strip())}

def write_record(path, record, body):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    header='\n'.join(key+': '+json.dumps(value,ensure_ascii=False) for key,value in record.items())
    temporary=path.with_name('.'+path.name+'.'+uuid.uuid4().hex+'.tmp')
    temporary.write_text('---\n'+header+'\n---\n\n'+body.rstrip()+'\n',encoding='utf-8');temporary.replace(path)
