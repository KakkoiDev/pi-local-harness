"""Publication checks for project files, exports, types and tests (task 231). No automatic downloads."""
import ast
from datetime import datetime
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys
import time
from gate import test_runs
from kit.publish_audit import ensure_task

ROOT=Path(__file__).resolve().parent.parent
LABELS={'files':'No unused files','code':'No unused code','references':'Every referenced file exists','types':'Types','tests':'All tests pass','description':'The README and the manifest describe this app'}


def inspect(root):
    """Follow local references from app entry points; report unreached source/assets and unimported JS functions.
    Literal imports, HTML/template assets, Python modules, manifests, cache lists and CSS references are followed.
    Dynamic message-language paths include the messages folder; other dynamic paths need manual review.
    """
    root=Path(root).resolve();seen=set();pending=[name for name in ['index.html','app/main.py','serve.py'] if (root/name).is_file()]
    def local(name,source):
        name=name.split('#',1)[0].split('?',1)[0]
        if re.match(r'^(?:[a-z][\w+.-]*:|//|#)',name,re.I):return []
        candidates=[root/name.lstrip('/'),root/Path(source).parent/name,root/'app/templates'/name]
        if name in {'sw.js','manifest.webmanifest'}:candidates.append(root/'static'/name)
        return [path.relative_to(root).as_posix() for candidate in candidates if (path:=candidate.resolve()).is_relative_to(root) and path.is_file()]
    while pending:
        name=pending.pop()
        if name in seen:continue
        seen.add(name);path=root/name
        try:text=path.read_text(encoding='utf-8')
        except (OSError,UnicodeError):continue
        for value in re.findall(r'''["'`]([^"'`\n]+)["'`]''',text):pending.extend(local(value,name))
        for value in re.findall(r'url\(\s*([^\s)]+)\s*\)',text):pending.extend(local(value.strip('"\''),name))
        for value in re.findall(r"url_for\(\s*['\"]static['\"]\s*,\s*path\s*=\s*['\"]([^'\"]+)['\"]",text):pending.extend(local('static/'+value.lstrip('/'),name))
        if 'messages' in text:
            pending.extend(path.relative_to(root).as_posix() for path in (root/'messages').glob('*.json'))
        if path.suffix=='.py':
            try:tree=ast.parse(text)
            except SyntaxError:continue
            modules=re.findall(r'-m\s+([\w]+(?:\.[\w]+)*)',text)
            for node in ast.walk(tree):
                if isinstance(node,ast.Import):modules.extend(alias.name for alias in node.names)
                elif isinstance(node,ast.ImportFrom):
                    base=(node.module or '').replace('.','/')
                    if node.level:base=str(Path(name).parent.joinpath(*(['..']*(node.level-1)))/base)
                    modules.extend([base,*[base+'/'+alias.name for alias in node.names]])
            for module in modules:
                base=module.replace('.','/') if '/' not in module else module
                for file in [base+'.py',base+'/__init__.py']:pending.extend(local(file,name))
                for parent in Path(base).parents:
                    if str(parent)!='.':pending.extend(local(str(parent)+'/__init__.py',name))
    candidates=[]
    for folder in ['js','app','static']:
        for path in (root/folder).rglob('*'):
            name=path.relative_to(root).as_posix()
            if not path.is_file() or path.is_symlink() or set(path.parts)&{'__pycache__','node_modules','.venv'}:continue
            if path.suffix in {'.md','.txt','.json','.toml','.pyc'} or (path.name.startswith(('test_','LICENSE')) or path.suffix.upper()=='.LICENSE') or 'tests' in path.parts:continue
            candidates.append(name)
    unused=[]
    for name in sorted(seen):
        if not name.endswith(('.mjs','.js')):continue
        text=(root/name).read_text(encoding='utf-8')
        exported=re.findall(r'\bexport\s+(?:async\s+)?function\s+(\w+)',text)+re.findall(r'\bexport\s+(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>',text)
        used=set()
        for other in root.rglob('*'):
            if not other.is_file() or other.is_symlink() or other.suffix not in {'.js','.mjs'} or set(other.parts)&{'node_modules','vendor','.git','.venv'}:continue
            source=other.relative_to(root).as_posix();body=other.read_text(encoding='utf-8',errors='replace')
            for match in re.finditer(r'''\bimport\s+([^;]+?)\s+from\s*['"]([^'"]+)['"]''',body):
                if name not in local(match[2],source):continue
                if '*' in match[1]:used.update(exported)
                used.update(re.findall(r'\b\w+\b',match[1]))
        unused.extend(name+': '+symbol for symbol in exported if symbol not in used)
    return {'unreached':sorted(set(candidates)-seen),'unused_exports':sorted(unused),'reached':sorted(seen)}




def description(root):
    """The person's task 231 decision: starter leftovers and consistent app names, not prose quality."""
    root=Path(root);problems=[]
    try:text=(root/'README.md').read_text(encoding='utf-8')
    except OSError:text=''
    goal=(root/'ROADMAP.md').read_text(encoding='utf-8') if (root/'ROADMAP.md').is_file() else ''
    notes_app=bool(re.search(r'\bnotes?\b',goal,re.I))
    heading=re.search(r'^#\s+(.+)',text,re.M)
    if not heading or re.search(r'^# A Pi Workbench',text,re.M) or not notes_app and re.search(r'\bnotes?\b',text,re.I):
        problems.append('README.md: replace the starter description with this app’s name and description.')
    names=[]
    for path in [root/'manifest.webmanifest',root/'static/manifest.webmanifest',root/'messages/en.json']:
        if not path.exists():continue
        try:values=json.loads(path.read_text(encoding='utf-8'))
        except (OSError,ValueError):problems.append(str(path.relative_to(root))+': invalid JSON.');continue
        name=values.get('app.name') if path.suffix=='.json' else values.get('name')
        if not isinstance(name,str) or not name.strip():problems.append(str(path.relative_to(root))+': add this app’s name.');continue
        names.append(name.strip())
        if not notes_app and any(values.get(key) in {'Notes','メモ'} for key in ['app.name','name','short_name']):problems.append(str(path.relative_to(root))+': replace the starter app name.')
    if names and (len({name.casefold() for name in names})!=1 or not heading or names[0].casefold() not in heading[1].casefold()):
        problems.append('README.md, manifest and English app name: use consistent app names.')
    return problems


def commands(root):
    root=Path(root);static=(root/'tsconfig.json').exists();tui=(root/'app/tui.py').exists()
    helper=lambda action:[sys.executable,'-m','harness.audit',action,str(root)]
    node=['uvx','--offline','--from','nodejs-wheel-binaries==24.19.0']
    uv=['uv','run','--offline','--frozen']
    vulture=json.loads((ROOT/'kit/toolchain.json').read_text())['python_packages']['vulture']
    return {'files':helper('files'),'code':helper('exports') if static else ['uvx','--offline','--from','vulture=='+vulture,'vulture','app',*(['serve.py'] if tui else []),'--min-confidence','80'],
            'references':[*node,'node','--test','tests/files.test.mjs'] if static else [*uv,'pytest','-q','tests/test_i18n.py' if tui else 'tests/test_files.py'],
            'types':[*node,'npx','--offline','--yes','-p','typescript@7.0.2','tsc','-p','.'] if static else [*uv,'pyright'],
            'tests':[*node,'node','--test'] if static else [*uv,'pytest','-q'],'description':helper('description')}


def run(root,data,request=None,project=None):
    """Run checked-in project tests/types offline; keep output and update only the audit's evidence boxes."""
    import os
    root=Path(root).resolve();data=Path(data);task=ensure_task(root)
    if not task:raise ValueError('A roadmap with open tasks is needed before the publication audit.')
    rows=[];environment={**os.environ,'UV_OFFLINE':'1','PYTHONDONTWRITEBYTECODE':'1','PYTHONPATH':str(ROOT)+os.pathsep+os.environ.get('PYTHONPATH','')}
    for key,argv in commands(root).items():
        started=time.monotonic()
        try:
            result=subprocess.run(argv,cwd=root,env=environment,capture_output=True,text=True,timeout=600)
            code=result.returncode;output=result.stdout+result.stderr
        except (OSError,subprocess.TimeoutExpired) as error:code=-1;output=str(error)
        passed=code==0
        if key=='tests' and not test_runs.counts(output).get('pass'):passed=False;output+='\nNo passing tests were recorded.'
        if key=='types':
            config=(root/'tsconfig.json').read_text() if (root/'tsconfig.json').is_file() else (root/'pyproject.toml').read_text() if (root/'pyproject.toml').is_file() else ''
            if not re.search(r'"strict"\s*:\s*true|typeCheckingMode\s*=\s*"strict"',config):passed=False;output+='\nStrict type checking must be enabled.'
        row={'key':key,'command':shlex.join(argv),'exit_code':code,'passed':passed,'duration':round(time.monotonic()-started,3),'output':output[-12000:]};rows.append(row)
        if key in {'tests','references'}:test_runs.record(data,request=request,project=project or root,cwd=root,command=row['command'],exit_code=code,duration=row['duration'],output=output)
    text=(root/task).read_text(encoding='utf-8')
    for row in rows:text=re.sub(r'^- \[[ xX]\] '+re.escape(LABELS[row['key']])+r':.*$', '- ['+('x' if row['passed'] else ' ')+'] '+LABELS[row['key']]+': `'+row['command']+'`',text,flags=re.M)
    when=datetime.now().astimezone().isoformat(timespec='seconds')
    text=text.split('\n## Last audit\n')[0].rstrip()+'\n\n## Last audit\n\n'+when+'\n'+''.join(f"\n- {row['key']}: exit {row['exit_code']}, {'passed' if row['passed'] else 'needs attention'}.\n" for row in rows)
    (root/task).write_text(text,encoding='utf-8')
    passed=all(row['passed'] for row in rows);roadmap=root/'ROADMAP.md'
    plan=roadmap.read_text(encoding='utf-8');plan=re.sub(r'^(\s*- )\[[ xX]\](.*\('+re.escape(task)+r'\))',lambda match:match[1]+'['+('x' if passed else ' ')+']'+match[2],plan,flags=re.M);roadmap.write_text(plan,encoding='utf-8')
    ready=passed and not re.search(r'^\s*- \[ \]',plan,re.M)
    result={'time':when,'task':task,'checks':rows,'ready':ready}
    (data/'audits').mkdir(parents=True,exist_ok=True);(data/'audits'/f'{time.time_ns()}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return result


def main(argv=None):
    argv=list(sys.argv[1:] if argv is None else argv)
    if len(argv)!=2 or argv[0] not in {'files','exports','description'}:raise SystemExit('Use python3 -m harness.audit files|exports|description <folder>.')
    action,root=argv;result=inspect(root) if action!='description' else None
    problems=description(root) if action=='description' else result['unreached'] if action=='files' else result['unused_exports']
    print('\n'.join(problems) if problems else 'Passed.')
    return 1 if problems else 0


if __name__=='__main__':raise SystemExit(main())
