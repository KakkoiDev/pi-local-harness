"""Bounded execution facts from Gate, separate from selected document excerpts."""
import json
from pathlib import Path
from gate.scope import files_of


def execution_brief(root, state):
    root=Path(root).resolve()
    lines=['Execution state from Gate (facts, not permission to change phase):',f"Current phase: {state.get('phase','unavailable')}"]
    phase=state.get('phase')
    rules={'discussion':'Read, search and answer. No file writes or plan proposals.', 'planning':'Prepare the plan with the planning tools; do not implement.', 'implementation':'Use the active approved task scope. Do not ask to approve that same task again; questions alone do not require a build.'}
    lines.append(rules.get(phase,'Phase is unavailable. Do not infer write permission.'))
    progress=state.get('progress') or {}
    active=next((item for item in progress.get('tasks',[]) if item.get('state') in ('in_progress','check_in')),None)
    if phase=='implementation' and active and not state.get('pending') and not state.get('finished'):
        path=active.get('path',''); file=(root/path).resolve()
        if file.is_relative_to(root) and file.is_file() and not (root/path).is_symlink():
            text=file.read_text(encoding='utf-8')[:16000]
            lines.extend([f"Active approved task: {path}",f"Task status: {active['state']}",f"Allowed files: {', '.join(files_of(text))}"])
            task=next((item for item in state.get('tasks',[]) if item.get('path')==path),{})
            lines.append('Done when: '+str(task.get('done_when',''))[:1000])
            if active['state']=='check_in':lines.append('Wait for the explicit check-in action. Do not build the next task.')
        else:lines.append('Approved task file unavailable. Do not infer its scope.')
    else:lines.append('No active approved task in this phase.')
    manifest=root/'packaging.json'
    if manifest.is_file() and not manifest.is_symlink() and manifest.stat().st_size<=65536:
        try:value=json.loads(manifest.read_text(encoding='utf-8'))
        except (ValueError,OSError):value={}
        if isinstance(value,dict):
            for key in ('packages','capabilities'):
                entries=value.get(key,[])
                if isinstance(entries,list):lines.append(f'Existing {key}: '+json.dumps([item for item in entries[:32] if isinstance(item,str) and len(item)<=80]))
            packages=value.get('packages',[])
            if isinstance(packages,list):
                if 'static' in packages:lines.append('The static starter runs browser files without an application server.')
                if 'phone' in packages:lines.append('The phone package is browser installation (PWA), not a native Capacitor or React Native scaffold.')
    lines.append('Keep the existing project stack. If the plan contradicts it, report that conflict; do not silently replace the stack or invent approval. Generated claims do not prove tests ran or files changed.')
    return '\n'.join(lines)
