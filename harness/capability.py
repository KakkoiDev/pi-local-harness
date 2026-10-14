"""Can a model answer two requests at once (plan 156 § 7, task 161)?

Measured by sending two short prompts at the same moment and comparing when each generated: if the two generation
phases overlap, Ollama runs them in parallel; if one waits for the other, the model answers one at a time. A result is
kept in <data>/model-capabilities.json under a key of model digest + Ollama version + OLLAMA_NUM_PARALLEL, so a new
Ollama release (for example a fixed MLX runner) or a new parallel setting makes it "unknown" until checked again.
The harness treats "unknown" as one at a time. experiments/parallel_inference/run.py is the longer manual version.
"""
import json
import os
import subprocess
import sys
import threading
import time
import urllib.request
from datetime import datetime
from pathlib import Path

from harness import model as models

PROMPTS = ['Write a short story about a lighthouse keeper.', 'Explain how a hash table works.']


def overlap(a, b):
    """Fraction of the shorter generation phase (first token to end) during which both were generating."""
    shared = min(a['end'], b['end']) - max(a['first_token'], b['first_token'])
    shorter = min(a['end'] - a['first_token'], b['end'] - b['first_token'])
    return max(0.0, shared) / shorter if shorter > 0 else 0.0


def words(value):
    return 'parallel' if value >= 0.5 else 'partly parallel' if value > 0.05 else 'one at a time'


def generate(url, model, prompt, ctx, tokens, start, result):
    body = json.dumps({'model': model, 'prompt': prompt, 'stream': True, 'think': False, 'options': {'num_ctx': ctx, 'num_predict': tokens}}).encode()
    request = urllib.request.Request(url + '/api/generate', body, {'Content-Type': 'application/json'})
    start.wait()
    result['sent'] = time.monotonic(); result['tokens'] = 0
    with urllib.request.urlopen(request, timeout=900) as response:
        for line in response:
            event = json.loads(line)
            if event.get('error'): raise RuntimeError(event['error'])
            if event.get('response'): result.setdefault('first_token', time.monotonic()); result['tokens'] += 1
            if event.get('done'): result['end'] = time.monotonic(); break


def together(url, model, ctx, tokens, prompts):
    """Send the prompts at the same moment; one result per prompt with sent, first_token, end and tokens."""
    start = threading.Event(); results = [{} for _ in prompts]; errors = []
    def worker(prompt, result):
        try: generate(url, model, prompt, ctx, tokens, start, result)
        except Exception as error: errors.append(error)
    threads = [threading.Thread(target=worker, args=pair) for pair in zip(prompts, results)]
    for thread in threads: thread.start()
    start.set()
    for thread in threads: thread.join()
    if errors: raise errors[0]
    return results


def num_parallel():
    """OLLAMA_NUM_PARALLEL as the Ollama app sees it (the environment, else launchctl on a Mac), or 'default'."""
    value = os.getenv('OLLAMA_NUM_PARALLEL')
    if value is None and sys.platform == 'darwin':
        try: value = subprocess.run(['launchctl', 'getenv', 'OLLAMA_NUM_PARALLEL'], capture_output=True, text=True, timeout=3).stdout.strip() or None
        except (OSError, subprocess.SubprocessError): value = None
    return value or 'default'


def keys():
    """The current key parts of every installed model: {name: {digest, ollama, num_parallel}}. Empty without Ollama."""
    try: tags = models.ollama('/api/tags', timeout=5).get('models', []); version = models.ollama('/api/version', timeout=5).get('version')
    except (OSError, ValueError): return {}
    slots = num_parallel()
    return {item['name']: {'digest': item.get('digest', ''), 'ollama': version, 'num_parallel': slots} for item in tags}


def store_path(data):
    return Path(data) / 'model-capabilities.json'


def stored(data):
    try: return json.loads(store_path(data).read_text())
    except (OSError, ValueError): return {}


def known(data, name, current=None):
    """The stored verdict when it still matches the model, Ollama and the parallel setting; else 'unknown'."""
    current = keys() if current is None else current
    key, saved = current.get(name), stored(data).get(name)
    if not key or not saved or any(saved.get(part) != key[part] for part in key): return 'unknown'
    return saved['verdict']


def missing(data):
    """Installed models without a result that matches (what a check would measure)."""
    current = keys()
    return [name for name in current if known(data, name, current) == 'unknown']


def check(data, name, tokens=64, ctx=4096):
    """Measure one model now: warm-up, one prompt alone, two at once. Stores and returns the result."""
    current = keys()
    if not current: raise ValueError(f'Ollama does not answer at {models.ollama_url()}.')
    if name not in current: raise ValueError(f"{name} is not installed. Installed: {', '.join(current)}.")
    url = models.ollama_url()
    together(url, name, ctx, 4, PROMPTS[:1])  # warm-up: loads the model, not measured
    alone = together(url, name, ctx, tokens, PROMPTS[:1])[0]
    pair = together(url, name, ctx, tokens, PROMPTS)
    rate = lambda result: result['tokens'] / max(1e-6, result['end'] - result['first_token'])
    combined = sum(result['tokens'] for result in pair) / max(1e-6, max(r['end'] for r in pair) - min(r['first_token'] for r in pair))
    value = overlap(*pair)
    result = {**current[name], 'verdict': words(value), 'overlap': round(value, 3), 'alone_tps': round(rate(alone), 1),
              'combined_x': round(combined / max(1e-6, rate(alone)), 2), 'checked': datetime.now().astimezone().isoformat(timespec='seconds')}
    everything = stored(data); everything[name] = result
    path = store_path(data); temporary = path.with_suffix('.tmp'); temporary.write_text(json.dumps(everything, indent=2) + '\n'); temporary.replace(path)
    return result
