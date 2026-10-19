"""Serve any ASGI app (FastAPI, Starlette) on a free local port for end-to-end tests. Copy this file as is.

The socket is bound and listening before the server thread starts, so the URL works at once: a request made before
uvicorn is ready waits in the socket's queue. Nothing sleeps and nothing polls (NOTES.md 3).
"""
from __future__ import annotations

import contextlib
import socket
import threading
from collections.abc import Iterator

import uvicorn


@contextlib.contextmanager
def serve(app) -> Iterator[str]:
    """Yield the app's base URL (http://127.0.0.1:PORT) and stop the server when the block ends."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("127.0.0.1", 0))
    sock.listen(128)
    server = uvicorn.Server(uvicorn.Config(app, log_level="warning", lifespan="off"))
    thread = threading.Thread(target=server.run, kwargs={"sockets": [sock]}, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{sock.getsockname()[1]}"
    finally:
        server.should_exit = True
        thread.join()
        sock.close()
