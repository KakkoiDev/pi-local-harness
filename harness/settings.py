"""Every harness setting in one place (task 166): its key in <data>/config.json, the environment variable plh passes to
Pi, Gate and the web workbench, its default, what values it takes and what it does. The console shows and changes them
(/config, /config set); plh reads them at start. A variable already set in the shell wins over config.json.

Also listed: the variables the harness sets for itself (read-only) and Ollama's own (changed with /ollama set)."""
import re

from harness.model import EFFORTS


def _number(low, high):
    def check(value):
        if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high: raise ValueError(f'a whole number from {low} to {high}')
        return value
    return check


def _effort(value):
    if value not in EFFORTS: raise ValueError(f"one of {', '.join(EFFORTS)}")
    return value


def _names(value):
    if not isinstance(value, list) or not all(isinstance(item, str) and re.fullmatch(r'[\w.@+-]+', item) for item in value):
        raise ValueError('a list of bare names, e.g. ["mini.example.ts.net"] or ["you@example.com"]')
    return value


def _flag(value):
    if not isinstance(value, bool): raise ValueError('true or false')
    return value


def _text(value):
    if not isinstance(value, str): raise ValueError('text')
    return value


def _choice(*allowed):
    def check(value):
        if value not in allowed: raise ValueError(' or '.join(allowed))
        return value
    return check


def _url(value):
    if not isinstance(value, str) or not re.fullmatch(r'https?://[\w.:\[\]-]+(/\S*)?', value): raise ValueError('an address such as http://127.0.0.1:11434')
    return value.rstrip('/')


# key: (environment variable, default, check, what it does, how the value goes into the variable)
SETTINGS = {
    'blips': ('PI_BLIPS', 'blips', _text, 'Path to the Chip Pops blips CLI used for local music and effects.', str),
    'effort': ('PI_WEB_EFFORT', 'high', _effort, 'Default thinking level when none is chosen in the menu bar.', str),
    'gate_port': ('PI_GATE_PORT', 8000, _number(0, 65535), 'Port of Gate, the command checker (0 picks a free one).', str),
    'web_port': ('PI_WEB_PORT', 3000, _number(0, 65535), 'Port of the web workbench on 127.0.0.1 (0 picks a free one).', str),
    'whisper_model': ('PI_WHISPER_MODEL', 'mlx-community/whisper-base-mlx', _text, 'Speech-to-text model for voice input (Whisper, MLX).', str),
    'remote_hosts': ('PI_WEB_REMOTE_HOSTS', [], _names, 'Tailnet host names allowed to open the web UI from a phone (tailscale serve).', ','.join),
    'remote_users': ('PI_WEB_REMOTE_USERS', [], _names, 'Tailscale logins allowed with those hosts.', ','.join),
    'auto_accept': (None, False, _flag, 'Run on its own for every project: recommended choices, approved plans, continued tasks and external actions. Turning on always requires the risk confirmation; takes effect immediately.', None),
    'updates_daily': (None, True, _flag, 'Check the source clone for updates once a day without installing them.', None),
    'auto_update': (None, True, _flag, 'Update the installed build when plh starts.', None),
    'silence_seconds': ('PI_HARNESS_SILENCE_SECONDS', 3600, _number(60, 7 * 24 * 3600), 'A request stops when Pi has sent nothing (no step, no output, no tool event) for this long. Long work that reports is fine.', str),
    'model_silence_seconds': ('PI_HARNESS_MODEL_SILENCE_SECONDS', 120, _number(10, 24 * 3600), 'A request fails (“the model stopped answering”) when Pi waits for the model and nothing arrives for this long: no token, no thought, no tool call. Tools, the harness’s checks and compaction have the silence_seconds limit instead. Raise it for a slow model that takes longer to start answering a long context.', str),
    'model_start_seconds': ('PI_HARNESS_MODEL_START_SECONDS', 900, _number(10, 24 * 3600), 'Until the model sends its first output in a request (loading a big model and reading a long prompt can take minutes), this much silence fails the request (“the model did not start answering”); after that, model_silence_seconds applies.', str),
    'wake_ups': ('PI_HARNESS_WAKE_UPS', 5, _number(0, 1000), 'How many times the harness may wake Pi in one request (after a loop, a hang, or stopping with work open) before it stops and offers Ask Pi to Retry…. 0: no limit (plan 184).', str),
    'hang_seconds': ('PI_HANG_MS', 60, _number(10, 3600), 'In a thought phase with no streamed activity for this long, the harness aborts, compacts and re-asks.', lambda value: str(value * 1000)),
    'ollama_url': ('PI_OLLAMA_URL', 'http://127.0.0.1:11434', _url, 'Where Ollama answers.', str),
    'tool_repair': ('PI_TOOL_REPAIR', True, _flag, 'Fix the tool calls a local model writes as text (task 326): Pi talks to Ollama through a small proxy that turns them into real calls.', lambda value: '1' if value else '0'),
    'tool_repair_port': ('PI_TOOL_REPAIR_PORT', 0, _number(0, 65535), 'Port of that proxy on 127.0.0.1 (0 picks a free one).', str),
    'tailscale': ('PI_TAILSCALE', 'tailscale', _text, 'The tailscale command for phone access (a path, or "false" to turn phone access off).', str),
    'python': ('PI_PYTHON', 'python3', _text, 'The Python that runs the services and the console.', str),
    'web_data': ('PI_WEB_DATA', '', _text, 'Folder for chats and uploads (empty: the data folder’s chats/).', str),
    'gate_auth': ('PI_GATE_AUTH', 'admin', _choice('standard', 'admin'), 'Gate profile for Pi’s tools: admin also allows high-risk tools; both enforce the destructive-shell rules.', str),
    'language': ('PI_HARNESS_LANGUAGE', 'system', _choice('system', 'en', 'ja'), 'The language shared with web Settings: system (the device locale), en or ja. /commands stay in English.', str),
    'detail': (None, 'beginner', _choice('beginner', 'expert'), 'How much the decision rows show (Settings › Pi › Detail, task 273): beginner hides decisions made by code; expert shows all with rules, paths and commands.', None),
    'audit_log': ('PI_HARNESS_LOG_FILE', '', _text, 'Gate’s audit log (empty: the data folder’s gate-audit.log).', str),
}
DEFAULTS = {key: default for key, (_, default, _, _, _) in SETTINGS.items()}
EXPLAIN = {key: about for key, (_, _, _, about, _) in SETTINGS.items()}

# Set by the harness itself, for each start or each request; shown by /config, never changed there.
INTERNAL = {
    'PI_LAYA_DATA': 'Classifier toolchain root override for isolated tests; normally the harness data folder.',
    'RIPGREP_CONFIG_PATH': 'Inherited ripgrep configuration; Gate refuses rg reads when set because configuration may execute preprocessors.',
    'PYTHONPATH': 'Inherited Python module search paths; publication checks add the installed harness for its checkers.',
    'PI_BINARY': 'The Pi program the workbench runs (pi by default; tests and scratch workbenches point it elsewhere).',
    'PI_AGENT_DATA': 'The data folder (config.json lives in it, so it is chosen before plh starts).',
    'PI_CODING_AGENT_DIR': 'Pi’s own settings folder (models.json, AGENTS.md); Pi’s default is ~/.pi/agent.',
    'PI_HARNESS_MEMORY': 'The shared instructions file injected before turns (the data folder’s AGENTS.md).',
    'PI_HARNESS_MODEL': 'The model of this session or request.',
    'PI_HARNESS_MODEL_THINKING': 'Whether that model thinks.',
    'PI_HARNESS_MODEL_VISION': 'Whether that model sees images.',
    'PI_HARNESS_SHARED_PORT': 'Gate’s port, given to the workbench’s own Pi requests.',
    'PI_HARNESS_TOKEN': 'Gate’s token, when set by hand; the extension removes it from the environment before Pi runs a command (task 261).',
    'PI_HARNESS_TOKEN_FILE': 'A private file with Gate’s token for those requests; the extension reads it once and removes it (task 261).',
    'PI_HARNESS_CONTEXT': 'The chosen context file of one request.',
    'PI_HARNESS_TURN_URL': 'Where a work request waits for its turn (one-at-a-time model).',
    'PI_HARNESS_LOCK_HELD': 'Set for the workbench’s requests: the workbench holds the agent lock for them.',
    'PI_HARNESS_TOOL_REPAIR_URL': 'The tool-call repair proxy in front of Ollama (task 326), given to the workbench’s own Pi requests; terminal Pi reads it from the services’ ready line.',
    'PI_HARNESS_JOB': 'The Activity request a web worker runs (plan 184: its paperwork is kept under this id).',
    'PI_HARNESS_BARE': 'The bench baseline: plain Pi with Gate\'s core safety rules only, none of the harness (python3 -m bench run --bare).',
    'PI_WEB_CWD': 'Folder for old chats without a project.',
    'PI_TRASH_DIR': 'Tests only: a folder used instead of the Trash.',
    'PLH_UPDATED': 'Set once after plh updated itself, so it does not update twice.',
    'XDG_DATA_HOME': 'Linux only: where the Trash is.',
}
# The system's: read, never set (the locale decides whether glyphs or ASCII are drawn).
SYSTEM = {'PATH', 'HOME', 'LANG', 'LC_ALL', 'LC_CTYPE'}
# Ollama's own variables: /ollama shows them and /ollama set changes them.
OLLAMA = {'OLLAMA_NUM_PARALLEL': 'num_parallel', 'OLLAMA_KEEP_ALIVE': 'keep_alive', 'OLLAMA_MODELS': 'models_folder'}


def validate(values, where='config.json'):
    """config.json's values with defaults filled in; ValueError naming the key and what it takes."""
    if 'model' in values: raise ValueError(f"The model is pinned in harness/model.json; remove 'model' from {where}")
    settings = {**DEFAULTS, **values}
    for key, value in list(settings.items()):
        if key not in SETTINGS: continue  # an old or unknown key is kept, not used
        try: settings[key] = SETTINGS[key][2](value)
        except ValueError as error: raise ValueError(f'{key} in {where} must be {error}') from None
    if bool(settings['remote_hosts']) != bool(settings['remote_users']): raise ValueError('Set remote_hosts and remote_users together')
    return settings


def environment(settings):
    """The variables plh passes on: one per setting that has one."""
    env = {name: convert(settings[key]) for key, (name, _, _, _, convert) in SETTINGS.items() if name}
    return {name: value for name, value in env.items() if value != ''}  # empty: the program's own default applies
