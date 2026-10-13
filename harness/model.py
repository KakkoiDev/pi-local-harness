"""The model this harness runs. harness/model.json is the default; the person can choose another local model and a
thinking level from the web menu bar (task 147), stored in <data>/model.json. config.json cannot override the model."""
import json
import os
import urllib.request
from pathlib import Path

_PIN = json.loads(Path(__file__).with_name('model.json').read_text())
PROVIDER = _PIN['provider']
MODEL = _PIN['model']
QUALIFIED = f'{PROVIDER}/{MODEL}'
EFFORTS = ('off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max')
OLLAMA = 'http://127.0.0.1:11434'


def ollama_url():
    return os.getenv('PI_OLLAMA_URL', OLLAMA)


def choice_path(data_root):
    return Path(data_root) / 'model.json'


def current(data_root, default_effort='high'):
    """The chosen model and thinking level, falling back to the pin and the configured effort."""
    try: saved = json.loads(choice_path(data_root).read_text())
    except (OSError, ValueError): saved = {}
    model = saved.get('model') if isinstance(saved.get('model'), str) and saved.get('model') else MODEL
    effort = saved.get('effort') if saved.get('effort') in EFFORTS else default_effort
    return {'provider': PROVIDER, 'model': model, 'effort': effort}


def save(data_root, **changes):
    value = {**current(data_root), **changes}
    path = choice_path(data_root); path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp'); temporary.write_text(json.dumps({'model': value['model'], 'effort': value['effort']}) + '\n'); temporary.replace(path)
    return value


def ollama(path, body=None, timeout=10, url=None):
    url = url or ollama_url()
    request = urllib.request.Request(url + path, data=json.dumps(body).encode() if body is not None else None, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=timeout) as response: return json.loads(response.read() or b'{}')


def local_models(url=None):
    """Installed Ollama models with what Pi needs to know: tools (required), thinking, vision."""
    models = []
    for item in ollama('/api/tags', url=url).get('models', []):
        try: capabilities = ollama('/api/show', {'model': item['name']}, url=url).get('capabilities', [])
        except OSError: capabilities = []
        models.append({'id': item['name'], 'size': item.get('size', 0), 'tools': 'tools' in capabilities, 'thinking': 'thinking' in capabilities, 'vision': 'vision' in capabilities})
    return models


def switch(previous, model, url=None):
    """Keep one model in memory: unload the previous one, then load the new one and wait until it answers."""
    if previous and previous != model:
        try: ollama('/api/generate', {'model': previous, 'keep_alive': 0}, url=url)
        except OSError: pass
    ollama('/api/generate', {'model': model, 'keep_alive': '30m'}, timeout=600, url=url)


def assumed(model):
    """Capabilities when Ollama cannot tell: the default model is known to think and see; others are assumed plain."""
    return {'id': model, 'tools': True, 'thinking': model == MODEL, 'vision': model == MODEL}


def effective(choice, capabilities):
    """What Pi runs with: the chosen model and level, thinking off for a model that does not think. Shared by the web and plh."""
    known = capabilities(choice['model'])
    return {**choice, 'effort': choice['effort'] if known.get('thinking') else 'off', 'thinking': bool(known.get('thinking')),
            'vision': bool(known.get('vision')), 'chosenEffort': choice['effort']}
