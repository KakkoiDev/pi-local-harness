"""Task 311: test runs are sandboxed.

In Implementation a test run executes code the model wrote, with the person's permissions. Gate allows only known test
runners (gate/phase_shell.test_run), and then this module runs the allowed command under macOS `sandbox-exec`:

- writes only in the project, a temporary folder of its own (TMPDIR) and the toolchain caches (uv, npm, cargo, the
  workbench's toolchain folder); never in the project's .git (a hook or a config line would run code at the harness's
  next commit);
- no network (local sockets between processes still work); the person may widen this per project to this computer
  (localhost) or to the internet, from the workbench (Project > Test Sandbox...), never Pi;
- reads everywhere except the workbench's data folder (other projects, chats, Gate's token file) and the usual secret
  folders (~/.ssh, ~/.aws, ~/.pi ...);
- a scrubbed environment: only PATH, HOME, the locale, the terminal and the toolchains' own variables; no PI_HARNESS_*,
  no tokens or keys.

Linux, for the port: the same policy is `bwrap --ro-bind / / --bind <project> <project> --bind <tmp> <tmp>
--ro-bind <project>/.git <project>/.git --tmpfs <data> --dev /dev --proc /proc --unshare-net --clearenv
--setenv PATH "$PATH" ...` (bubblewrap); `--share-net` for the internet widening. Until then a run on another system
is not sandboxed and the note says so.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import sys
import tempfile
import threading

EXECUTABLE = Path('/usr/bin/sandbox-exec')
RUNNER = Path(__file__).with_name('sandbox-run.sh')
NETWORK = ('none', 'local', 'internet')
# The variables a run keeps are listed in sandbox-run.sh (an allow-list: no PI_HARNESS_*, no tokens or keys).
SECRET_FOLDERS = ('.ssh', '.aws', '.gnupg', '.config/gh', '.netrc', '.git-credentials', '.pi', '.docker', 'Library/Keychains')
CACHES = ('.cache', 'Library/Caches', '.npm', '.cargo', '.rustup', '.local/share/uv', '.bun/install/cache', '.yarn', '.pnpm-store', 'Library/pnpm')
REFUSED = re.compile(r'Operation not permitted|\[Errno 1\]|\bEPERM\b|sandbox-exec:|deny\(\d+\)', re.I)
LOCK = threading.Lock()


def available():
    return sys.platform == 'darwin' and EXECUTABLE.is_file()


def real(path):
    """Seatbelt matches real paths (/var is /private/var on macOS)."""
    return os.path.realpath(os.path.expanduser(str(path)))


def settings_file(data):
    return Path(data) / 'sandbox.json'


def widened(data, root):
    """The person's widening for this project: {'network': 'none' | 'local' | 'internet'}."""
    if not data: return {'network': 'none'}
    try: saved = json.loads(settings_file(data).read_text(encoding='utf-8'))
    except (OSError, ValueError): saved = {}
    found = (saved.get('projects') or {}).get(real(root)) if isinstance(saved, dict) else None
    network = found.get('network') if isinstance(found, dict) else None
    return {'network': network if network in NETWORK else 'none'}


def widen(data, root, network, state='chosen'):
    """The person's choice (a person-only route, never a Pi tool): how far this project's test runs may reach."""
    if state != 'chosen': raise ValueError('Only the person can widen the test sandbox.')
    if network not in NETWORK: raise ValueError('Choose none, local or internet.')
    path = settings_file(data)
    with LOCK:
        try: saved = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, ValueError): saved = {}
        if not isinstance(saved, dict): saved = {}
        projects = saved.setdefault('projects', {})
        if network == 'none': projects.pop(real(root), None)
        else: projects[real(root)] = {'network': network}
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix('.tmp'); temporary.write_text(json.dumps(saved, indent=2) + '\n', encoding='utf-8'); temporary.replace(path)
    return widened(data, root)


def quoted(path):
    return '"' + str(path).replace('\\', '\\\\').replace('"', '\\"') + '"'


def profile(root, temporary, data=None, network='none', home=None):
    """The Seatbelt profile (SBPL) for one project. Later rules win."""
    root, temporary, home = real(root), real(temporary), real(home or Path.home())
    writes = [root, temporary, *(real(Path(home) / name) for name in CACHES)]
    if data: writes.append(real(Path(data) / 'toolchain'))
    lines = ['(version 1)', '(allow default)',
             '(deny network*)', '(allow network* (local unix))', '(allow network* (remote unix))']
    if network == 'local': lines += ['(allow network* (local ip "localhost:*"))', '(allow network* (remote ip "localhost:*"))']
    if network == 'internet': lines.append('(allow network*)')
    lines += ['(deny file-write*)',
              '(allow file-write* ' + ' '.join(f'(subpath {quoted(path)})' for path in writes) + ' (subpath "/dev"))',
              f'(deny file-write* (subpath {quoted(Path(root) / ".git")}))']
    hidden = [real(Path(home) / name) for name in SECRET_FOLDERS]
    if data: hidden.append(real(data))
    lines.append('(deny file-read* file-write* ' + ' '.join(f'(subpath {quoted(path)})' for path in hidden) + ')')
    # A project inside the data folder (the workbench's own projects) is still the project; so is its toolchain.
    if data and Path(root).is_relative_to(real(data)):
        lines.append(f'(allow file-read* (subpath {quoted(root)}))')
        lines.append(f'(allow file-write* (subpath {quoted(root)}))')
        lines.append(f'(deny file-write* (subpath {quoted(Path(root) / ".git")}))')
    if data: lines.append(f'(allow file-read* file-write* (subpath {quoted(real(Path(data) / "toolchain"))}))')
    return '\n'.join(lines) + '\n'


def prepare(root, data=None, network=None, home=None):
    """Write the profile and make the run's temporary folder: (profile file, temporary folder)."""
    key = hashlib.sha256(real(root).encode()).hexdigest()[:16]
    temporary = Path(tempfile.gettempdir()) / 'pi-test-runs' / key
    temporary.mkdir(parents=True, exist_ok=True)
    network = network or widened(data, root)['network']
    text = profile(root, temporary, data, network, home)
    folder = Path(data) / 'sandbox' if data else Path(tempfile.gettempdir()) / 'pi-test-runs' / 'profiles'
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / (hashlib.sha256(text.encode()).hexdigest()[:24] + '.sb')
    if not path.is_file():
        partial = path.with_suffix(f'.{os.getpid()}.tmp'); partial.write_text(text, encoding='utf-8'); partial.replace(path)
    return path, temporary


def wrap(command, root, data=None, network=None):
    """The shell command that runs `command` in the sandbox (for Pi's bash tool), or None where there is no sandbox."""
    if not available(): return None
    path, temporary = prepare(root, data, network)
    return f'/bin/sh {shlex.quote(str(RUNNER))} {shlex.quote(str(path))} {shlex.quote(str(temporary))} {shlex.quote(command)}'


def argv(arguments, root, data=None, network=None):
    """The same for a run the harness starts itself (a list for subprocess), or the arguments unchanged."""
    if not available(): return list(arguments)
    path, temporary = prepare(root, data, network)
    return ['/bin/sh', str(RUNNER), str(path), str(temporary), shlex.join(str(part) for part in arguments)]


def shell(command, root, data=None, network=None):
    """For a harness run of a shell command string (subprocess with shell=False)."""
    if not available(): return ['/bin/sh', '-c', command]
    path, temporary = prepare(root, data, network)
    return ['/bin/sh', str(RUNNER), str(path), str(temporary), command]


def refusal(output, exit_code, network='none'):
    """The sentence for Pi and the person when a failing run met the sandbox, else None."""
    if not exit_code or not REFUSED.search(str(output or '')): return None
    reach = {'none': 'no network', 'local': 'network only to this computer (localhost)', 'internet': 'the internet'}[network]
    return ('The test sandbox may have refused something this run tried (“Operation not permitted”). Test runs may write only in the '
            f'project, a temporary folder (TMPDIR) and the toolchain caches, never in .git, and have {reach}. Write test files under '
            'the project or TMPDIR. If a test really needs the network, the person can widen the sandbox for this project with '
            'Project ▸ Test Sandbox… in the workbench; do not work around it.')
