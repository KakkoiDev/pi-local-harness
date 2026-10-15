"""The app in a browser (the workbench's Preview, or a phone): textual-serve starts it for each visitor."""
import sys

from textual_serve.server import Server

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
Server(f"{sys.executable} -m app.tui", host="127.0.0.1", port=port).serve()
