"""Persist the user's chosen defaults without replacing other pi settings."""
import json
import os
from pathlib import Path

agent = Path(os.environ.get('PI_CODING_AGENT_DIR', str(Path.home() / '.pi/agent')))
settings_path = agent / 'settings.json'
settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
settings.update(defaultProvider='ollama', defaultModel='gemma4:26b-mlx', defaultThinkingLevel='high')
settings_path.write_text(json.dumps(settings, indent=2) + '\n')
memory = agent / 'AGENTS.md'
preference = 'User preference: plain `pi` starts the local harness with `gemma4:26b-mlx` and high thinking effort. Load Whisper only when an audio file is submitted. Show question submission and message/task completion timestamps in the transcript.'
if preference not in memory.read_text():
    with memory.open('a') as handle:
        handle.write('\n## Harness preferences\n\n' + preference + '\n')
print('Default: ollama/gemma4:26b-mlx, thinking=high; Whisper remains lazy-loaded.')
