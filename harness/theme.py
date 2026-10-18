"""Task 312, the theme panel: the app's Basecoat theme tokens (kit/vendor/basecoat-1.0.2/css/base/base.css), read from
Basecoat's defaults plus one marked block in the project's styles/input.css, and written back as that block only. The
block holds just the tokens the person changed; every other line of the file stays as it was, and a file this reader
cannot follow is refused with a plain message (no guessing at arbitrary CSS)."""
from datetime import datetime
from pathlib import Path
import re
import subprocess
import uuid

FILE = 'styles/input.css'
START = '/* theme: edited in the workbench */'
END = '/* theme: end */'
NO_FILE = 'This project has no theme file'
KIT_BASE = Path(__file__).resolve().parent.parent / 'kit/vendor/basecoat-1.0.2/css/base/base.css'
HEADINGS = ':where(h1, h2, h3, h4, h5, h6)'
HEADING_RULE = f'{HEADINGS} {{ font-family: var(--font-heading); }}'
MARK = 'Workbench-Change: theme'  # the commit trailer that lets Undo take back the person's theme save (harness/undo.py)

# (token, its foreground or None, plain words, the colour its contrast is checked against, the AA minimum)
COLOURS = [
    ('background', 'foreground', 'Background and text', None, 4.5),
    ('card', 'card-foreground', 'Cards', None, 4.5),
    ('popover', 'popover-foreground', 'Menus and popovers', None, 4.5),
    ('primary', 'primary-foreground', 'Primary: buttons and links', None, 4.5),
    ('secondary', 'secondary-foreground', 'Secondary buttons', None, 4.5),
    ('muted', 'muted-foreground', 'Muted: quiet areas and hints', None, 4.5),
    ('accent', 'accent-foreground', 'Accent: hover and selection', None, 4.5),
    ('destructive', None, 'Destructive: delete and errors', 'background', 4.5),
    ('border', None, 'Borders', None, None),
    ('input', None, 'Field borders', None, None),
    ('ring', None, 'Focus ring', None, None),
    ('sidebar', 'sidebar-foreground', 'Sidebar', None, 4.5),
    ('sidebar-primary', 'sidebar-primary-foreground', 'Sidebar: primary', None, 4.5),
    ('sidebar-accent', 'sidebar-accent-foreground', 'Sidebar: accent', None, 4.5),
    ('sidebar-border', None, 'Sidebar borders', None, None),
    ('sidebar-ring', None, 'Sidebar focus ring', None, None),
]
CHARTS = [(f'chart-{n}', None, f'Chart colour {n}', 'background', 3.0) for n in range(1, 6)]  # graphics: 3:1 (WCAG 1.4.11)


def _rows(rows):
    return [{'token': token, 'foreground': fore, 'label': label, 'against': against or fore, 'minimum': minimum} for token, fore, label, against, minimum in rows]


GROUPS = {
    'colours': {'title': 'Colours', 'kind': 'colour', 'rows': _rows(COLOURS)},
    'charts': {'title': 'Chart colours', 'kind': 'colour', 'rows': _rows(CHARTS)},
    'radius': {'title': 'Corner radius', 'kind': 'length', 'token': 'radius', 'min': 0, 'max': 2, 'step': 0.025, 'unit': 'rem'},
    'spacing': {'title': 'Spacing', 'kind': 'length', 'token': 'spacing', 'min': 0.125, 'max': 0.5, 'step': 0.0125, 'unit': 'rem'},
    'fonts': {'title': 'Fonts', 'kind': 'font', 'tokens': ['font-sans', 'font-heading']},
}
COLOUR_TOKENS = [name for token, fore, *_ in COLOURS + CHARTS for name in (token, fore) if name]
LENGTHS = {'radius': (0, 4), 'spacing': (0.0625, 1)}  # rem; px are read as 16 to the rem
FONT_TOKENS = ('font-sans', 'font-heading')
ALLOWED = (*COLOUR_TOKENS, *LENGTHS, *FONT_TOKENS)  # the only names the block and the Preview helper accept
TEXT = {'colours': 'Here are the colour values.', 'charts': 'Here are the chart colours.', 'radius': 'Here is the corner radius.',
        'spacing': 'Here is the spacing.', 'fonts': 'Here are the fonts.'}
FALLBACK = {'serif': 'ui-serif, Georgia, serif', 'monospace': 'ui-monospace, SFMono-Regular, Menlo, monospace', 'handwriting': 'cursive', 'display': 'ui-sans-serif, system-ui, sans-serif'}
SANS = 'ui-sans-serif, system-ui, sans-serif'


class ThemeFileError(ValueError):
    """The file holds something this reader does not follow; nothing was changed."""


# -- recognising the request (System 1, code first) --------------------------------------------------------------
WORDS = [('charts', r'chart colou?rs?|chart palette|グラフの色|チャートの色'), ('radius', r'radius|radii|rounded corners|corner rounding|roundness|角丸|角の丸み'),
         ('spacing', r'spacing|余白|間隔'), ('fonts', r'fonts?|typefaces?|typography|フォント|書体'), ('colours', r'colou?rs?|palette|colou?r scheme|theme|色|カラー|配色|テーマ')]
VERB = r'(?:adjust|change|tweak|edit|customi[sz]e|modify|tinker with|play with|tune|set|pick|choose|see|show me|look at|open)'
OWNER = r'(?:(?:the|my|our|this)\s+)?(?:(?:site|app|website|page|project)s?(?:\'s|’s)?\s+)?'
STRONG_EN = re.compile(r'^(?:(?:i(?:\s+want|\s+would\s+like|\'d\s+like|’d\s+like)\s+to|can\s+i|could\s+i|let\s+me|please|could\s+you|can\s+you|i\s+wanna)\s+)?' + VERB + r'\s+' + OWNER
                       + r'(?:theme\s+)?(?P<word>[a-z ]+?)(?:\s+(?:of|on|for)\s+(?:the|my|this)\s+(?:site|app|website|page))?(?:\s+please)?[\s.!?]*$', re.I)
STRONG_JA = re.compile(r'^(?:この)?(?:サイト|アプリ|ページ|ウェブサイト)?の?(?P<word>.{1,8}?)(?:を|も)?(?:調整|変更|変え|いじ|カスタマイズ|編集|見|開)(?:したい|たい|て|てください|てほしい|る|ます)?(?:です)?[。！!？?\s]*$')
THEME_PANEL = re.compile(r'^(?:/theme|(?:open\s+)?the\s+theme\s+panel|theme\s+panel|テーマパネル(?:を開いて)?)[\s.!?。]*$', re.I)


def group_of(text):
    """The panel the words name (the first group word in the text), or None."""
    found = [(match.start(), group) for group, words in WORDS for match in [re.search(words, text, re.I)] if match]
    return min(found)[1] if found else None


def recognise(message):
    """('yes', group) when the whole message asks for the panel; ('maybe', group) when it mentions the look but code is
    unsure (Laya decides); (None, None) otherwise, which is the normal path to Pi."""
    text = ' '.join(str(message or '').split())
    if not text or len(text) > 200: return None, None
    if THEME_PANEL.match(text): return 'yes', group_of(text.replace('theme', '')) or 'colours'
    group = group_of(text)
    if not group: return None, None
    for pattern in (STRONG_EN, STRONG_JA):
        found = pattern.match(text)
        if found and group_of(found['word']) == group and re.fullmatch(r'(?:\s*(?:the|and|values?|settings?|値|設定|の|と)\s*)*', re.sub(dict(WORDS)[group], '', found['word'], flags=re.I)):
            return 'yes', group
    return 'maybe', group


# -- Basecoat's defaults -----------------------------------------------------------------------------------------
DECLARATION = re.compile(r'^\s*--([a-z0-9-]+):\s*(.+?);\s*(?:/\*.*\*/)?\s*$')


def defaults(root=None):
    """{'light': …, 'dark': …} for the allowed tokens: the project's own copy of Basecoat's base.css, else the kit's."""
    own = Path(root) / 'vendor/basecoat/css/base/base.css' if root else None
    source = own if own and own.is_file() else KIT_BASE
    light, dark, current = {}, {}, None
    for line in source.read_text(encoding='utf-8').splitlines():
        stripped = line.strip()
        if stripped.startswith(':root'): current = light
        elif stripped.startswith(('.dark', 'html.dark')): current = dark
        elif stripped.startswith('@theme'): current = 'theme'
        elif stripped == '}': current = None
        elif current is not None:
            found = DECLARATION.match(line)
            if not found or found[1] not in ALLOWED: continue
            (light if current == 'theme' else current)[found[1]] = found[2]
    light.setdefault('spacing', '0.25rem')  # Tailwind v4's base unit
    light.setdefault('font-heading', '')    # headings use the body font unless the person chooses one
    return {'light': light, 'dark': dark}


# -- the file: reading and writing the one block -----------------------------------------------------------------
def _scan(text):
    """Comments and strings blanked out (same length), so braces and markers are counted only where they are CSS."""
    out, index = [], 0
    while index < len(text):
        if text.startswith('/*', index):
            end = text.find('*/', index + 2)
            if end < 0: raise ThemeFileError(f'{FILE} has a comment that is never closed.')
            out.append(' ' * (end + 2 - index)); index = end + 2
        elif text[index] in '"\'':
            quote, end = text[index], index + 1
            while end < len(text) and text[end] != quote:
                if text[end] == '\n': raise ThemeFileError(f'{FILE} has a string that is never closed.')
                end += 2 if text[end] == '\\' else 1
            if end >= len(text): raise ThemeFileError(f'{FILE} has a string that is never closed.')
            out.append(' ' * (end + 1 - index)); index = end + 1
        else: out.append(text[index]); index += 1
    return ''.join(out)


def _locate(text):
    """(start, end) of the block, or None. Refuses a file whose braces do not balance or whose markers are odd."""
    plain = _scan(text); depth = 0
    for char in plain:
        depth += (char == '{') - (char == '}')
        if depth < 0: break
    if depth: raise ThemeFileError(f'{FILE} could not be read: its braces do not balance. Fix the file by hand, then open the panel again.')
    starts, ends = [m.start() for m in re.finditer(re.escape(START), text)], [m.start() for m in re.finditer(re.escape(END), text)]
    if not starts and not ends: return None
    if len(starts) != 1 or len(ends) != 1 or ends[0] < starts[0]:
        raise ThemeFileError(f'{FILE} has a broken theme block (its start and end marks do not pair up). Fix it by hand, then open the panel again.')
    if plain[:starts[0]].count('{') != plain[:starts[0]].count('}'):
        raise ThemeFileError(f'{FILE} has its theme block inside another rule. Move it out by hand, then open the panel again.')
    return starts[0], ends[0] + len(END)


def _declarations(body):
    """'a: b; c: d' → [(a, b), …], splitting only outside quotes and brackets."""
    parts, current, depth, quote = [], '', 0, None
    for char in body:
        if quote: quote = None if char == quote else quote
        elif char in '"\'': quote = char
        elif char == '(': depth += 1
        elif char == ')': depth -= 1
        if char == ';' and not quote and depth == 0: parts.append(current); current = ''
        else: current += char
    parts.append(current)
    found = []
    for part in filter(str.strip, parts):
        if ':' not in part: raise ThemeFileError(f'The theme block in {FILE} has a line the workbench did not write: “{part.strip()[:60]}”.')
        name, value = part.split(':', 1); found.append((name.strip(), value.strip()))
    return found


def read_block(text):
    """The block's tokens: {'light', 'dark', 'faces', 'span'}; empty when there is none. ThemeFileError when unreadable."""
    span = _locate(text)
    result = {'light': {}, 'dark': {}, 'faces': [], 'span': span}
    if not span: return result
    inner = text[span[0] + len(START):span[1] - len(END)]
    if '/*' in inner: raise ThemeFileError(f'The theme block in {FILE} has comments or text the workbench did not write. Fix it by hand, then open the panel again.')
    index = 0
    for found in re.finditer(r'([^{}]+)\{([^{}]*)\}', inner):
        if inner[index:found.start()].strip(): break
        index = found.end(); selector = ' '.join(found[1].split()); body = _declarations(found[2])
        if selector == '@font-face': result['faces'].append(body); continue
        if selector == HEADINGS and body == [('font-family', 'var(--font-heading)')]: continue
        target = {':root': result['light'], 'html.dark': result['dark']}.get(selector)
        if target is None: raise ThemeFileError(f'The theme block in {FILE} has a rule the workbench did not write: “{selector[:60]}”. Fix it by hand, then open the panel again.')
        for name, value in body:
            if not name.startswith('--') or name[2:] not in ALLOWED or problem(name[2:], value):
                raise ThemeFileError(f'The theme block in {FILE} has a value the workbench did not write: “{name}: {value[:40]}”. Fix it by hand, then open the panel again.')
            target[name[2:]] = value
    if inner[index:].strip(): raise ThemeFileError(f'The theme block in {FILE} has text the workbench did not write. Fix it by hand, then open the panel again.')
    return result


def render(light, dark, faces=()):
    """The block's text, tokens in Basecoat's order; None when nothing is changed (the block goes)."""
    if not light and not dark and not faces: return None
    order = {name: index for index, name in enumerate(ALLOWED)}
    lines = [START]
    lines += ['@font-face { ' + '; '.join(f'{name}: {value}' for name, value in face) + '; }' for face in faces]
    for selector, values in ((':root', light), ('html.dark', dark)):
        if values: lines += [selector + ' {', *[f'  --{name}: {values[name]};' for name in sorted(values, key=order.get)], '}']
    if light.get('font-heading'): lines.append(HEADING_RULE)
    return '\n'.join(lines + [END])


def write_block(text, block):
    """The file with the block replaced, inserted after the imports, or removed (block None). Nothing else changes, so
    inserting and then removing gives back the same text."""
    span = _locate(text)
    if span:
        start, end = span
        if block is not None: return text[:start] + block + text[end:]
        if text[end:end + 1] == '\n': end += 1
        if text[start - 2:start] == '\n\n': start -= 1
        return text[:start] + text[end:]
    if block is None: return text
    imports = [m for m in re.finditer(r'^@import\b[^\n]*(?:\n|$)', text, re.M) if _scan(text[:m.start()]).count('{') == _scan(text[:m.start()]).count('}')]
    position = imports[-1].end() if imports else 0
    if position and text[position - 1:position] != '\n': text, position = text + '\n', position + 1
    return text[:position] + '\n' + block + '\n' + text[position:]


# -- values ------------------------------------------------------------------------------------------------------
COLOUR = re.compile(r'#[0-9a-fA-F]{3,8}|(?:oklch|oklab|rgb|rgba|hsl|hsla|lab|lch)\([-0-9a-z.%\s,/+]*\)|transparent', re.I)
LENGTH = re.compile(r'(\d+(?:\.\d+)?|\.\d+)(rem|px)')
FONT_VALUE = re.compile(r'"[A-Za-z0-9 ]{1,60}"(?:,\s*[-A-Za-z0-9" ]+)*')


def problem(token, value):
    """Why this value is refused for this token, or None. Only plain CSS values: no url(), no ; { } < >."""
    if not isinstance(value, str) or len(value) > 200 or re.search(r'[;{}<>\\]|url\(|/\*', value, re.I): return 'Not a plain CSS value.'
    if token in COLOUR_TOKENS: return None if COLOUR.fullmatch(value.strip()) else f'“{value}” is not a colour (use #rrggbb, rgb(), hsl() or oklch()).'
    if token in LENGTHS:
        found = LENGTH.fullmatch(value.strip()) or (value.strip() == '0' and LENGTH.fullmatch('0rem'))
        if not found: return f'“{value}” is not a size (use rem or px).'
        rem = float(found[1]) / (16 if found[2] == 'px' else 1); low, high = LENGTHS[token]
        return None if low <= rem <= high else f'{value} is outside {low}–{high} rem.'
    if token in FONT_TOKENS: return None if FONT_VALUE.fullmatch(value.strip()) else f'“{value}” is not a font list the workbench writes.'
    return f'{token} is not a theme token.'


def same(a, b):
    return ' '.join(str(a or '').lower().split()) == ' '.join(str(b or '').lower().split())


def family(value):
    """The first family of a font token ('"Inter", ui-sans-serif' → 'Inter'), or None."""
    found = re.match(r'\s*"([^"]+)"', value or '')
    return found[1] if found else None


def font_value(name, category=''):
    return f'"{name}", {FALLBACK.get(category.lower().replace(" ", ""), SANS)}'


# -- the project -------------------------------------------------------------------------------------------------
def has_theme(root):
    css = Path(root) / FILE
    try: text = css.read_text(encoding='utf-8') if css.is_file() else ''
    except (OSError, UnicodeError): return False
    return '@import "tailwindcss"' in text.replace("'", '"') and 'basecoat' in text


def state(root):
    """What the panel shows: the groups, Basecoat's defaults, the saved changes, and the fonts in use. A project without
    the starter's CSS gets only the message."""
    root = Path(root)
    if not has_theme(root): return {'available': False, 'message': NO_FILE + '.', 'detail': f'The panel edits the {FILE} of a project made from a starter. Nothing here was changed.'}
    try: block = read_block((root / FILE).read_text(encoding='utf-8'))
    except (ThemeFileError, UnicodeError) as error: return {'available': False, 'message': str(error) if isinstance(error, ThemeFileError) else f'{FILE} is not UTF-8 text.', 'path': FILE}
    return {'available': True, 'path': FILE, 'groups': GROUPS, 'allowed': list(ALLOWED), 'defaults': defaults(root),
            'saved': {'light': block['light'], 'dark': block['dark']}, 'fonts': {key: family(block['light'].get(f'font-{key}')) for key in ('sans', 'heading')}}


def context_note(root):
    """For Pi's context once the person has saved a theme (task 312): the tokens changed, so styles use them."""
    try: block = read_block((Path(root) / FILE).read_text(encoding='utf-8')) if has_theme(root) else None
    except (OSError, UnicodeError, ThemeFileError): return ''
    if not block or not block['span']: return ''
    names = ', '.join(dict.fromkeys([*block['light'], *block['dark']]))
    return (f'The person tuned the app’s theme in the workbench ({FILE}, the block marked “theme: edited in the workbench”: {names}). '
            'Style with the theme’s tokens and classes (bg-primary, text-primary-foreground, text-muted-foreground, border-border, '
            'rounded-lg, font-sans), never hard-coded colours or sizes, and leave that block to the person.')


def git(root, *args, check=True):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=60, check=check)


def save(root, light=None, dark=None, fonts=None, download=None):
    """The person's Save: light/dark map tokens to a value or None (back to Basecoat's default); fonts maps 'sans' or
    'heading' to a Google Fonts family or None. download(family, folder) brings a new family's files into the project
    and returns its @font-face declarations (harness/theme_fonts.py). Writes the block, commits it as the person's own
    change with the theme mark (so Undo can take it back) and returns {'message', 'commit', 'names', 'files'}."""
    root = Path(root)
    if not has_theme(root): raise ValueError(NO_FILE + '.')
    css = root / FILE
    text = css.read_text(encoding='utf-8'); block = read_block(text); base = defaults(root)
    new = {'light': dict(block['light']), 'dark': dict(block['dark'])}
    for mode, changes in (('light', light or {}), ('dark', dark or {})):
        if not isinstance(changes, dict): raise ValueError('Send the changed tokens as names and values.')
        for token, value in changes.items():
            if token not in ALLOWED or token in FONT_TOKENS: raise ValueError(f'{token} is not a theme token the panel changes.')
            if mode == 'dark' and token not in COLOUR_TOKENS: raise ValueError(f'{token} has one value for light and dark.')
            if value is None or same(value, base[mode].get(token)): new[mode].pop(token, None); continue
            reason = problem(token, value)
            if reason: raise ValueError(reason)
            new[mode][token] = ' '.join(value.split())
    faces, files = list(block['faces']), []
    for key, chosen in (fonts or {}).items():
        if key not in ('sans', 'heading'): raise ValueError('Choose the body font or the heading font.')
        token = f'font-{key}'
        if not chosen: new['light'].pop(token, None); continue
        if not isinstance(chosen, str) or not re.fullmatch(r'[A-Za-z0-9 ]{1,60}', chosen): raise ValueError('Choose a font from the list.')
        if family(new['light'].get(token)) == chosen: continue
        value = next((new['light'][other] for other in FONT_TOKENS if family(new['light'].get(other)) == chosen), None)
        if not any(family(dict(face).get('font-family', '')) == chosen for face in faces):
            if not download: raise ValueError('Fonts can only be added from the font list.')
            got = download(chosen, root)  # the person's Save click is the approval for this download
            faces += got['faces']; files += got['files']; value = font_value(chosen, got.get('category', ''))
        new['light'][token] = value or font_value(chosen)
    used = {family(new['light'].get(token)) for token in FONT_TOKENS} - {None}
    faces = [face for face in faces if family(dict(face).get('font-family', '')) in used]  # a font no token names leaves the block (its files stay)
    names = [token for token in ALLOWED if any(not same(new[mode].get(token), block[mode].get(token)) for mode in ('light', 'dark'))]
    if not names: return {'unchanged': True, 'message': 'Nothing to save: the theme is as it was saved.', 'names': []}
    updated = write_block(text, render(new['light'], new['dark'], faces))
    if (root / '.git').exists() and git(root, 'status', '--porcelain', '--', FILE, check=False).stdout.strip():
        from harness.undo import save_edits
        save_edits(root, [FILE])  # the person's own unsaved edits of the file stay their own entry, apart from the theme
    temporary = css.with_name(f'.{css.name}.{uuid.uuid4().hex}.tmp')
    temporary.write_text(updated, encoding='utf-8'); temporary.replace(css)
    title = 'Theme: ' + ', '.join(name.removeprefix('font-') + (' font' if name.startswith('font-') else '') for name in names)
    result = {'message': title.replace('Theme:', 'Theme saved:', 1) + '.', 'names': names, 'files': [FILE, *files], 'title': title}
    if (root / '.git').exists():
        who = git(root, 'config', 'user.name', check=False).stdout.strip() or 'You'
        mail = git(root, 'config', 'user.email', check=False).stdout.strip() or 'you@localhost'
        git(root, 'add', '--', FILE, *files)
        done = git(root, '-c', f'user.name={who}', '-c', f'user.email={mail}', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', title, '-m', f'Saved in the theme panel at {datetime.now().strftime("%H:%M")}.\n\n{MARK}', '--', FILE, *files, check=False)
        if done.returncode == 0: result['commit'] = git(root, 'rev-parse', '--short=12', 'HEAD').stdout.strip()
        else: result['note'] = 'Saved, but git could not record it: ' + (done.stderr.strip()[-200:] or 'unknown error')
    return result
