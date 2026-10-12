"""Install the reviewed harness in pi's global agent directory."""
import os
from pathlib import Path

root = Path(__file__).resolve().parent.parent
agent = Path(os.environ.get('PI_CODING_AGENT_DIR', str(Path.home() / '.pi/agent')))
agent.mkdir(parents=True, exist_ok=True)
memory = agent / 'AGENTS.md'
content = (root / 'harness/AGENTS.md').read_text()
if not memory.exists():
    memory.write_text(content)
elif '# Local AI operating instructions' not in memory.read_text():
    with memory.open('a') as handle:
        handle.write('\n\n' + content)
extensions = agent / 'extensions'
extensions.mkdir(exist_ok=True)
link = extensions / 'local-harness.ts'
target = root / '.pi/extensions/local-harness.ts'
if not link.exists() and not link.is_symlink():
    link.symlink_to(target)
elif link.resolve() != target.resolve():
    raise RuntimeError(f'Refusing to overwrite existing extension: {link}')
print(f'Memory: {memory}\nExtension: {link}')
