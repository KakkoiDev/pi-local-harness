"""Keep one publication audit as the last task of a project roadmap (task 231)."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent.parent


def files_line():
    """The template's Files: line (task 327): what Ready to publish may change to make its checks pass."""
    return next(line for line in (ROOT/'kit/publish-audit.md').read_text(encoding='utf-8').splitlines() if line.startswith('Files:'))


def scoped(file):
    """A Ready to publish task made before task 327 has no Files: line, so Gate refused every write in it: add the line."""
    if not file.is_file() or file.is_symlink():return
    text=file.read_text(encoding='utf-8')
    if re.search(r'^Files:',text,re.M):return
    kind=re.search(r'^Kind:.*$',text,re.M)
    file.write_text(text[:kind.end()]+'\n'+files_line()+text[kind.end():] if kind else text.rstrip()+'\n\n'+files_line()+'\n',encoding='utf-8')


def ensure_task(root,reset=False):
    """One audit at the end of a roadmap with open work; moving it never changes another task's boxes."""
    root=Path(root);roadmap=root/'ROADMAP.md'
    if not roadmap.is_file():return None
    text=roadmap.read_text(encoding='utf-8');lines=text.splitlines()
    existing=next((re.search(r'\((tasks/\d+-ready-to-publish\.md)\)',line) for line in lines if re.search(r'\((tasks/\d+-ready-to-publish\.md)\)',line)),None)
    if not any(re.match(r'\s*[-*+] \[ \]',line) and '-ready-to-publish.md)' not in line for line in lines):return existing[1] if existing else None
    files=sorted((root/'tasks').glob('[0-9]*-ready-to-publish.md'))
    if existing:path=existing[1]
    elif files:path=files[0].relative_to(root).as_posix()
    else:
        (root/'tasks').mkdir(exist_ok=True)
        number=max([int(match[1]) for file in (root/'tasks').glob('*.md') if (match:=re.match(r'(\d+)-',file.name))] or [0])+1
        path=f'tasks/{number:03d}-ready-to-publish.md'
        template=(ROOT/'kit/publish-audit.md').read_text(encoding='utf-8')
        (root/path).write_text(template.replace('{number}',f'{number:03d}'),encoding='utf-8')
    scoped(root/path)
    line=next((line for line in lines if f'({path})' in line),f'- [ ] [Ready to publish]({path})')
    if reset:
        line=re.sub(r'- \[[xX]\]', '- [ ]',line)
        file=root/path
        file.write_text(re.sub(r'^- \[[xX]\]', '- [ ]',file.read_text(encoding='utf-8'),flags=re.M),encoding='utf-8')
    lines=[value for value in lines if f'({path})' not in value]
    roadmap.write_text('\n'.join(lines).rstrip()+'\n'+line+'\n',encoding='utf-8')
    return path
