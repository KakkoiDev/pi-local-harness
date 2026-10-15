"""Hidden check: at 1024x560, after Add, the page must not lift: nothing outside #list may scroll or be scrollable."""
import json, os, subprocess, sys, threading
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

project, harness = Path(sys.argv[1]), Path(sys.argv[2])
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(project)))
threading.Thread(target=server.serve_forever, daemon=True).start()
script = f"""import {{ look }} from {json.dumps(str(harness / 'harness/browser.mjs'))};
const result = await look({{ target: 'http://127.0.0.1:{server.server_address[1]}/index.html', width: 1024, height: 560, steps: [{{ click: 'Add' }}, {{ click: 'Add' }}], probes: ['scrolled', 'scrollable'] }});
console.log(JSON.stringify(result));"""
out = subprocess.run(['node', '--input-type=module', '-e', script], capture_output=True, text=True, timeout=120)
server.shutdown()
result = json.loads(out.stdout or '{}')
if result.get('error'): print(result['error']); sys.exit(2)
outside = [item for item in result['facts']['scrolled'] + result['facts']['scrollable'] if item['element'] not in ('section#list',)]
print(json.dumps(outside)); sys.exit(1 if outside else 0)
