"""Task 304: the Preview's file server for an app with no server (index.html at the top, kit/starter-static).

It replaces `python -m http.server`, which followed symlinks out of the project, served .env and .git, listed folders
and answered any Host. This one serves only real files inside the project folder (the current directory), never a
dot-path, never a listing, and only to a loopback Host (a rebound DNS name such as evil.example:8000 is refused).

    python3 harness/preview_files.py <port>      # run from the project folder
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

LOOPBACK = ('127.0.0.1', 'localhost', '[::1]', '::1')


def loopback(host):
    """True when the Host header names this machine (any port): the only names a page on this machine is served to."""
    if not host: return False
    name = host.strip().lower()
    if name.startswith('['): name = name.split(']', 1)[0] + ']'
    elif name.count(':') == 1: name = name.split(':', 1)[0]
    return name in LOOPBACK


def own_origin(origin, port):
    """No Origin (not a page in a browser), or the app's own loopback origin. Any other site's page is refused."""
    return not origin or origin in {f'http://127.0.0.1:{port}', f'http://localhost:{port}', f'http://[::1]:{port}'}


def inside(root, request_path):
    """The real file a URL path names inside root, or None: no dot-part (.env, .git/config), nothing that resolves
    outside root (a symlink to /etc, ../), and folders only through their index.html."""
    root = Path(root).resolve()
    parts = [part for part in unquote(urlsplit(request_path).path).split('/') if part]
    if any(part.startswith('.') or '\\' in part or '\0' in part for part in parts): return None
    target = root.joinpath(*parts)
    try: real = target.resolve(strict=True)
    except (OSError, RuntimeError): return None
    if real != root and not real.is_relative_to(root): return None
    if real.is_dir():
        index = real / 'index.html'
        try: index = index.resolve(strict=True)
        except (OSError, RuntimeError): return None
        if not index.is_relative_to(root) or not index.is_file(): return None
        return index
    return real if real.is_file() else None


class Handler(SimpleHTTPRequestHandler):
    root = Path.cwd()
    def log_message(self, *args): pass
    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff'); self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def send_head(self):
        if not loopback(self.headers.get('Host')):
            self.send_error(403, 'This preview answers only on this computer'); return None
        path = urlsplit(self.path).path
        found = inside(self.root, self.path)
        if found is None:
            self.send_error(404, 'Not found'); return None
        if not path.endswith('/') and (Path(self.root).resolve() / unquote(path).lstrip('/')).is_dir():  # a folder: its address ends with /
            self.send_response(301); self.send_header('Location', path + '/'); self.send_header('Content-Length', '0'); self.end_headers(); return None
        try: handle = open(found, 'rb')
        except OSError:
            self.send_error(404, 'Not found'); return None
        size = found.stat().st_size
        self.send_response(200); self.send_header('Content-Type', self.guess_type(str(found))); self.send_header('Content-Length', str(size))
        self.end_headers()
        return handle
    def list_directory(self, path):
        self.send_error(404, 'Not found'); return None
    def do_POST(self): self.send_error(405, 'This preview serves files only')
    do_PUT = do_DELETE = do_PATCH = do_POST


def serve(port, root='.'):
    Handler.root = Path(root).resolve()
    server = ThreadingHTTPServer(('127.0.0.1', int(port)), Handler); server.daemon_threads = True
    return server


if __name__ == '__main__':
    print(f'Serving the project on http://127.0.0.1:{sys.argv[1]}/', flush=True)
    serve(sys.argv[1]).serve_forever()
