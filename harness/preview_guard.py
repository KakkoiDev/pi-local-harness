"""Task 304: Open on Phone puts the app on the tailnet through this guard, never directly.

`tailscale serve` passes every tailnet request to a local port and adds the caller's Tailscale login. The workbench
itself admits only the logins in remote_users (config.json); before this guard, the app on :8443 admitted anyone on the
tailnet. The guard applies the same check to each request, then passes the bytes through unchanged (pages, server-sent
events and WebSockets alike) with the app's own loopback Host and Origin, so the app's own checks (harness/preview_files.py,
harness/terminal-preview.py) accept it. Each connection carries one request (`Connection: close`), so a connection that
Serve reuses for another person is checked again.
"""
import socket
import threading

LIMIT = 64 * 1024
DROP = {'connection', 'keep-alive', 'proxy-connection', 'host', 'origin'}


def head_of(connection):
    """The request's head (up to the blank line) and whatever body bytes came with it; None when it never ends."""
    data = b''
    while b'\r\n\r\n' not in data:
        chunk = connection.recv(8192)
        if not chunk or len(data) > LIMIT: return None, b''
        data += chunk
    head, _, rest = data.partition(b'\r\n\r\n')
    return head.decode('latin-1'), rest


def refuse(connection, status, text):
    body = text.encode()
    connection.sendall(f'HTTP/1.1 {status}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: {len(body)}\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n\r\n'.encode() + body)


def pipe(source, target):
    try:
        while chunk := source.recv(65536): target.sendall(chunk)
    except OSError: pass
    finally:
        for end in (source, target):
            try: end.shutdown(socket.SHUT_RDWR)
            except OSError: pass


class Guard:
    def __init__(self, port, host, users, phone_port):
        self.port, self.users = port, frozenset(users)
        self.hosts = {host, f'{host}:{phone_port}'}
        self.origins = {f'https://{host}', f'https://{host}:{phone_port}'}
        self.server = socket.create_server(('127.0.0.1', 0)); self.listen_port = self.server.getsockname()[1]
        self.closed = False
        threading.Thread(target=self.accept, daemon=True).start()

    def accept(self):
        while not self.closed:
            try: connection, _ = self.server.accept()
            except OSError: return
            threading.Thread(target=self.handle, args=(connection,), daemon=True).start()

    def check(self, headers):
        """None when the request may pass, else (status, sentence)."""
        if headers.get('host', '') not in self.hosts: return '403 Forbidden', 'This app is served only on the workbench\'s phone address.'
        if not self.users or headers.get('tailscale-user-login') not in self.users:
            return '403 Forbidden', 'Not allowed: this Tailscale login is not in remote_users (config.json).'
        origin = headers.get('origin')
        if origin and origin not in self.origins: return '403 Forbidden', 'Only the app\'s own page can use it.'
        return None

    def handle(self, connection):
        upstream = None
        try:
            connection.settimeout(30)
            head, rest = head_of(connection)
            if head is None: return
            first, *lines = head.split('\r\n')
            headers = {}
            for line in lines:
                name, _, value = line.partition(':'); headers[name.strip().lower()] = value.strip()
            problem = self.check(headers)
            if problem: refuse(connection, *problem); return
            upgrade = 'upgrade' in headers.get('connection', '').lower() and headers.get('upgrade')
            kept = [line for line in lines if line.partition(':')[0].strip().lower() not in DROP | {'tailscale-user-login', 'tailscale-user-name', 'tailscale-user-profile-pic'}]
            kept += [f'Host: 127.0.0.1:{self.port}', 'Connection: Upgrade' if upgrade else 'Connection: close']
            if headers.get('origin'): kept.append(f'Origin: http://127.0.0.1:{self.port}')
            upstream = socket.create_connection(('127.0.0.1', self.port), timeout=30)
            upstream.sendall(('\r\n'.join([first, *kept]) + '\r\n\r\n').encode('latin-1') + rest)
            connection.settimeout(None); upstream.settimeout(None)
            back = threading.Thread(target=pipe, args=(upstream, connection), daemon=True); back.start()
            pipe(connection, upstream); back.join()
        except OSError:
            try: refuse(connection, '502 Bad Gateway', 'The app did not answer.')
            except OSError: pass
        finally:
            for end in (connection, upstream):
                if end:
                    try: end.close()
                    except OSError: pass

    def close(self):
        self.closed = True
        try: self.server.close()
        except OSError: pass
