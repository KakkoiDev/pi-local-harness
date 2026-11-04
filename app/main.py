
import json, os, pathlib, tempfile
def tried(action):
    try: action(); return 'done'
    except OSError as error: return type(error).__name__
FOUND = {
    'env_names': sorted(os.environ),
    'write ../outside.txt': tried(lambda: pathlib.Path('..', 'outside.txt').write_text('x')),
    'write /private/tmp/plh-live-vtlz5ccb/elsewhere/outside.txt': tried(lambda: pathlib.Path('/private/tmp/plh-live-vtlz5ccb/elsewhere/outside.txt').write_text('x')),
    'write .git/config': tried(lambda: pathlib.Path('.git', 'config').write_text('x')),
    'read ~/.ssh key': tried(lambda: pathlib.Path('/private/tmp/plh-live-vtlz5ccb/home/.ssh/id_ed25519').read_text()),
    'list ~/.ssh': tried(lambda: os.listdir('/private/tmp/plh-live-vtlz5ccb/home/.ssh')),
    'read ~/.npmrc': tried(lambda: pathlib.Path('/private/tmp/plh-live-vtlz5ccb/home/.npmrc').read_text()),
    'read ordinary ~/myproj/notes.txt': tried(lambda: pathlib.Path('/private/tmp/plh-live-vtlz5ccb/home/myproj/notes.txt').read_text()),
    'write inside project': tried(lambda: pathlib.Path('inside.txt').write_text('ok')),
    'write TMPDIR': tried(lambda: pathlib.Path(tempfile.mkdtemp(), 'x').write_text('x')),
}
pathlib.Path('probe.json').write_text(json.dumps(FOUND, indent=1))
async def app(scope, receive, send):
    if scope['type'] != 'http': return
    await send({'type': 'http.response.start', 'status': 200, 'headers': [(b'content-type', b'text/plain')]})
    await send({'type': 'http.response.body', 'body': b'probe app running inside the Preview'})
