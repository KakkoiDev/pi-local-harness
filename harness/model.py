"""The model this harness runs. harness/model.json is the default; the person can choose another local model and a
thinking level from the web menu bar (task 147), stored in <data>/model.json. config.json cannot override the model.
A model comes from Ollama or, task 294, from a Colibri server (`coli serve`) the person runs on its own port."""
import json
import os
import re
import urllib.request
from pathlib import Path

_PIN = json.loads(Path(__file__).with_name('model.json').read_text())
PROVIDER = _PIN['provider']
MODEL = _PIN['model']
QUALIFIED = f'{PROVIDER}/{MODEL}'
EFFORTS = ('off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max')  # what Pi accepts, and what may be saved
# The levels Ollama tells apart (tasks 175, 177): the menu and the completion offer these; the others read as the nearest.
LEVELS = ('off', 'low', 'medium', 'high')
NEAREST = {'minimal': 'low', 'xhigh': 'high', 'max': 'high'}
OLLAMA = 'http://127.0.0.1:11434'
COLIBRI = 'http://127.0.0.1:8100'  # never Gate's 8000, which is Colibri's own default
PROVIDERS = ('ollama', 'colibri')
# Colibri's /v1/models has no tool flag. Its docs: GLM, DeepSeek V4, Kimi K3, Qwen3.6 and Qwen3.8 call tools; OLMoE and
# Inkling do not. Any other family is reported as unknown and without tools, never guessed.
COLIBRI_TOOLS = re.compile(r'glm|deepseek|kimi|qwen-?3[._-]?[68](?!\d)', re.I)
COLIBRI_NO_TOOLS = re.compile(r'olmoe|inkling', re.I)


def ollama_url():
    return os.getenv('PI_OLLAMA_URL', OLLAMA)


def colibri_url():
    return os.getenv('PI_COLIBRI_URL', COLIBRI).rstrip('/')


def choice_path(data_root):
    return Path(data_root) / 'model.json'


def current(data_root, default_effort='high'):
    """The chosen model and thinking level, falling back to the pin and the configured effort."""
    try: saved = json.loads(choice_path(data_root).read_text())
    except (OSError, ValueError): saved = {}
    model = saved.get('model') if isinstance(saved.get('model'), str) and saved.get('model') else MODEL
    effort = saved.get('effort') if saved.get('effort') in EFFORTS else default_effort
    effort = NEAREST.get(effort, effort)
    provider = saved.get('provider') if saved.get('provider') in PROVIDERS and model == saved.get('model') else PROVIDER  # an old file: Ollama
    return {'provider': provider, 'model': model, 'effort': effort}


def save(data_root, **changes):
    if 'model' in changes and 'provider' not in changes: changes['provider'] = PROVIDER  # a model named alone is Ollama's
    if changes.get('provider', PROVIDER) not in PROVIDERS: raise ValueError(f"Unknown model provider “{changes['provider']}”: ollama or colibri.")
    value = {**current(data_root), **changes}
    path = choice_path(data_root); path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp'); temporary.write_text(json.dumps({'provider': value['provider'], 'model': value['model'], 'effort': value['effort']}) + '\n'); temporary.replace(path)
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
        models.append({'id': item['name'], 'provider': 'ollama', 'size': item.get('size', 0), 'tools': 'tools' in capabilities, 'thinking': 'thinking' in capabilities, 'vision': 'vision' in capabilities})
    return models


def colibri(path, timeout=5, url=None):
    with urllib.request.urlopen((url or colibri_url()) + path, timeout=timeout) as response: return json.loads(response.read() or b'{}')


def colibri_family(model_id):
    """(tools, family): whether a Colibri model calls tools, from its family as Colibri documents it; 'unknown' says so."""
    if COLIBRI_NO_TOOLS.search(model_id): return False, 'known'
    if COLIBRI_TOOLS.search(model_id): return True, 'known'
    return False, 'unknown'


def colibri_models(url=None):
    """The models a Colibri server serves (one per `coli serve`), with what Pi needs to know. plh does not drive
    Colibri's thinking, so thinking is off; vision when the server says it takes images."""
    models = []
    for item in colibri('/v1/models', url=url).get('data', []):
        if not isinstance(item, dict) or not isinstance(item.get('id'), str): continue
        tools, family = colibri_family(item['id'])
        models.append({'id': item['id'], 'provider': 'colibri', 'size': 0, 'tools': tools, 'thinking': False,
                       'vision': 'image' in (item.get('input_modalities') or []), 'family': family})
    return models


def switch(previous, model, url=None):
    """Keep one model in memory: unload the previous one, then load the new one and wait until it answers."""
    if previous and previous != model:
        try: ollama('/api/generate', {'model': previous, 'keep_alive': 0}, url=url)
        except OSError: pass
    ollama('/api/generate', {'model': model, 'keep_alive': '30m'}, timeout=600, url=url)


def assumed(model, provider=PROVIDER):
    """Capabilities when the server cannot tell: the default model is known to think and see; others are assumed plain."""
    if provider == 'colibri': return {'id': model, 'provider': 'colibri', 'tools': colibri_family(model)[0], 'thinking': False, 'vision': False}
    return {'id': model, 'provider': PROVIDER, 'tools': True, 'thinking': model == MODEL, 'vision': model == MODEL}


def effective(choice, capabilities):
    """What Pi runs with: the chosen model and level, thinking off for a model that does not think. Shared by the web and plh.
    capabilities(model, provider) returns None when the server answered and the model is not there (removed, or Colibri
    now serves another one): Pi then runs the default model, and `missing` names the chosen one so the page can say so."""
    provider = choice.get('provider', PROVIDER)
    known, missing = capabilities(choice['model'], provider), None
    if known is None and (choice['model'], provider) != (MODEL, PROVIDER):
        missing, choice = choice['model'], {**choice, 'model': MODEL, 'provider': PROVIDER}
        known = capabilities(MODEL, PROVIDER)
    known = known or assumed(choice['model'], choice.get('provider', PROVIDER))
    return {**choice, 'effort': choice['effort'] if known.get('thinking') else 'off', 'thinking': bool(known.get('thinking')),
            'vision': bool(known.get('vision')), 'chosenEffort': choice['effort'], 'missing': missing}
