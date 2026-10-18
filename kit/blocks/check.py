"""Check a generated page against the App Blocks rules (plan 266 item 7): deterministic, no network.

    python3 kit/blocks/check.py <file> [<file> …]     # exit 1 when a page has errors; warnings never fail

Each finding is one line a small model can act on: the file and line, what is wrong, and the exact fix.

Errors (the page renders wrong, or someone cannot use it):
  class      a class Basecoat 1.0.2 does not have and Tailwind does not make (the pre-1.0 btn-outline, an invented .form)
  label      a field with no label, a button with no name
  chart      a chart with no table of the same numbers, or no words for a screen reader
  colour     a hard-coded colour (#0072b2, bg-blue-500, style="color: red") instead of a theme token
  cdn        a script, stylesheet or font loaded from the network instead of the project's own copy
Warnings (AppFoundations rules worth a second look):
  breakpoint a viewport breakpoint (md:, lg:) where App Blocks use the container one (@3xl:)
  fixed      position fixed inside the app (only dialogs and the toaster float)

The class list is what a project loads: kit/vendor/basecoat-1.0.2/css/basecoat.css with its imports (vega), the App
foundations rules and the game kit's game-* classes (both from kit/blocks), and Tailwind v4 utilities (recognised by
their families and values below). tests/test_app_blocks.py runs this on every block's markup.
"""
import html.parser
import re
import sys
from functools import cache
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIT = HERE.parent
BASECOAT = KIT / 'vendor/basecoat-1.0.2/css'

# Tailwind v4 (the starters' build): utility families and the values each takes. Colours, sizes and keywords are
# Tailwind's own names; the theme's colour names are Basecoat's tokens. `[...]` (an arbitrary value) fits any family.
TOKENS = ('background foreground card card-foreground popover popover-foreground primary primary-foreground secondary '
          'secondary-foreground muted muted-foreground accent accent-foreground destructive destructive-foreground border '
          'input ring sidebar sidebar-foreground sidebar-primary sidebar-primary-foreground sidebar-accent '
          'sidebar-accent-foreground sidebar-border sidebar-ring chart-1 chart-2 chart-3 chart-4 chart-5').split()
PALETTE = 'slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose'.split()
PALETTE_COLOUR = re.compile(r'^(?:%s)-(?:50|[1-9]00|950)$' % '|'.join(PALETTE))
PLAIN = {'transparent', 'current', 'inherit', 'white', 'black'}
NUMBER = r'-?\d+(?:\.\d+)?'
SIZE = r'(?:\d+(?:\.\d+)?|\d+/\d+|px|auto|full|screen|dvh|dvw|svh|lvh|svw|lvw|min|max|fit|none|prose|0|(?:\d)?xs|sm|md|lg|(?:\d)?xl)'
TEXT_SIZE = r'(?:xs|sm|base|lg|(?:[2-9])?xl)'
FAMILIES = {
    # spacing and sizing
    **{name: SIZE for name in 'p px py pt pr pb pl ps pe m mx my mt mr mb ml ms me gap gap-x gap-y space-x space-y w h min-w min-h max-w max-h size inset inset-x inset-y top right bottom left start end basis translate-x translate-y scroll-m scroll-mt scroll-mb scroll-p scroll-pt scroll-pb indent'.split()},
    'z': r'(?:\d+|auto)', 'order': r'(?:\d+|first|last|none)', 'opacity': r'\d+',
    'grid-cols': r'(?:\d+|none|subgrid)', 'grid-rows': r'(?:\d+|none|subgrid)', 'col': r'auto', 'row': r'auto',
    'col-span': r'(?:\d+|full)', 'row-span': r'(?:\d+|full)', 'col-start': r'(?:\d+|auto)', 'col-end': r'(?:\d+|auto)',
    'row-start': r'(?:\d+|auto)', 'row-end': r'(?:\d+|auto)', 'auto-cols': r'(?:auto|min|max|fr)', 'auto-rows': r'(?:auto|min|max|fr)',
    'grid-flow': r'(?:row|col|dense|row-dense|col-dense)', 'columns': r'(?:\d+|' + SIZE + ')',
    'flex': r'(?:1|auto|initial|none|row|col|row-reverse|col-reverse|wrap|wrap-reverse|nowrap)', 'grow': r'\d*', 'shrink': r'\d*',
    'items': r'(?:start|end|center|baseline|stretch|end-safe|center-safe)', 'self': r'(?:auto|start|end|center|stretch|baseline)',
    'justify': r'(?:start|end|center|between|around|evenly|stretch|normal)', 'justify-items': r'(?:start|end|center|stretch|normal)',
    'justify-self': r'(?:auto|start|end|center|stretch)', 'content': r'(?:start|end|center|between|around|evenly|stretch|normal|none)',
    'place-items': r'(?:start|end|center|stretch|baseline)', 'place-content': r'(?:start|end|center|between|around|evenly|stretch)',
    'place-self': r'(?:auto|start|end|center|stretch)',
    # type
    'text': TEXT_SIZE + r'|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip', 'font': r'(?:sans|serif|mono|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)',
    'leading': r'(?:none|tight|snug|normal|relaxed|loose|\d+(?:\.\d+)?)', 'tracking': r'(?:tighter|tight|normal|wide|wider|widest)',
    'line-clamp': r'(?:\d+|none)', 'whitespace': r'(?:normal|nowrap|pre|pre-line|pre-wrap|break-spaces)',
    'break': r'(?:words|all|keep|normal|after-\w+|before-\w+|inside-\w+)', 'hyphens': r'(?:none|manual|auto)', 'list': r'(?:none|disc|decimal|inside|outside)',
    'decoration': r'(?:solid|double|dotted|dashed|wavy|auto|from-font|\d+)', 'underline-offset': r'(?:auto|\d+)', 'align': r'(?:baseline|top|middle|bottom|text-top|text-bottom|sub|super)',
    # borders, rings, shadows
    'border': r'(?:\d+|solid|dashed|dotted|double|hidden|none|collapse|separate|x|y|t|r|b|l|s|e)', 'border-x': r'\d*', 'border-y': r'\d*',
    'border-t': r'\d*', 'border-r': r'\d*', 'border-b': r'\d*', 'border-l': r'\d*', 'border-s': r'\d*', 'border-e': r'\d*', 'border-spacing': SIZE,
    'rounded': r'(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full)', 'ring': r'(?:\d+|inset)', 'ring-offset': r'\d+', 'outline': r'(?:none|hidden|dashed|dotted|double|solid|\d+)',
    'outline-offset': r'\d+', 'shadow': r'(?:2xs|xs|sm|md|lg|xl|2xl|none|inner)', 'divide-x': r'\d*', 'divide-y': r'\d*', 'divide': r'(?:solid|dashed|dotted|none)',
    # colour-taking families (also take TOKENS, PALETTE colours and PLAIN)
    'bg': r'(?:fixed|local|scroll|clip-\w+|origin-\w+|bottom|center|left|right|top|repeat|no-repeat|repeat-x|repeat-y|auto|cover|contain|none|linear-to-\w+|gradient-to-\w+)',
    'from': NUMBER + '%', 'via': NUMBER + '%', 'to': NUMBER + '%', 'fill': r'none', 'stroke': r'\d+', 'accent': r'auto', 'caret': r'(?!)', 'placeholder': r'(?!)',
    # layout and the rest
    'overflow': r'(?:auto|hidden|clip|visible|scroll)', 'overflow-x': r'(?:auto|hidden|clip|visible|scroll)', 'overflow-y': r'(?:auto|hidden|clip|visible|scroll)',
    'overscroll': r'(?:auto|contain|none)', 'overscroll-x': r'(?:auto|contain|none)', 'overscroll-y': r'(?:auto|contain|none)',
    'object': r'(?:contain|cover|fill|none|scale-down|bottom|center|left|right|top)', 'aspect': r'(?:auto|square|video|\d+/\d+)',
    'cursor': r'(?:auto|default|pointer|wait|text|move|help|not-allowed|none|progress|cell|crosshair|grab|grabbing|col-resize|row-resize|zoom-in|zoom-out)',
    'select': r'(?:none|text|all|auto)', 'touch': r'(?:auto|none|pan-x|pan-y|manipulation|pinch-zoom)', 'pointer-events': r'(?:none|auto)', 'appearance': r'(?:none|auto)',
    'resize': r'(?:none|x|y)?', 'snap': r'(?:start|end|center|align-none|normal|always|none|x|y|both|mandatory|proximity)',
    'transition': r'(?:all|colors|opacity|shadow|transform|none)?', 'duration': r'\d+', 'delay': r'\d+', 'ease': r'(?:linear|in|out|in-out|initial)',
    'animate': r'(?:spin|ping|pulse|bounce|none)', 'rotate': NUMBER, 'scale': r'\d+', 'scale-x': r'-?\d+', 'scale-y': r'-?\d+', 'origin': r'(?:center|top|top-right|right|bottom-right|bottom|bottom-left|left|top-left)',
    'blur': r'(?:none|xs|sm|md|lg|xl|2xl|3xl)?', 'drop-shadow': r'(?:none|xs|sm|md|lg|xl|2xl)', 'backdrop-blur': r'(?:none|xs|sm|md|lg|xl|2xl|3xl)?', 'mix-blend': r'\w+', 'will-change': r'\w+',
    'float': r'(?:left|right|start|end|none)', 'clear': r'(?:left|right|both|none|start|end)', 'box': r'(?:border|content)', 'field-sizing': r'(?:content|fixed)',
    'table': r'(?:auto|fixed|caption|cell|row|column|header-group|footer-group|row-group)', 'forced-color-adjust': r'(?:auto|none)', 'scheme': r'(?:light|dark|normal)',
}
COLOUR_FAMILIES = {'bg', 'text', 'border', 'border-x', 'border-y', 'border-t', 'border-r', 'border-b', 'border-l', 'border-s', 'border-e', 'ring',
                   'ring-offset', 'outline', 'fill', 'stroke', 'decoration', 'from', 'via', 'to', 'divide', 'accent', 'caret', 'placeholder', 'shadow'}
WORDS = set('''flex grid block inline inline-block inline-flex inline-grid hidden contents flow-root list-item table-row table-cell
sr-only not-sr-only truncate italic not-italic underline overline line-through no-underline uppercase lowercase capitalize normal-case
absolute relative fixed sticky static isolate isolation-auto grow shrink antialiased subpixel-antialiased tabular-nums ordinal slashed-zero
lining-nums oldstyle-nums proportional-nums normal-nums diagonal-fractions visible invisible collapse border rounded shadow ring outline
transition transform resize container prose-none break-normal border-solid border-dashed text-balance text-pretty text-nowrap text-wrap
pointer-events-none pointer-events-auto select-none touch-none outline-none group peer divide-x divide-y drop-shadow
border-x border-y border-t border-r border-b border-l border-s border-e'''.split())
VARIANT = re.compile(r'^(?:@(?:max-)?(?:\d?xs|sm|md|lg|\d?xl)|(?:max-)?(?:sm|md|lg|xl|2xl)|hover|focus|focus-visible|focus-within|active|visited|'
                     r'disabled|enabled|checked|indeterminate|required|invalid|valid|placeholder-shown|read-only|open|empty|first|last|only|odd|even|'
                     r'first-of-type|last-of-type|dark|motion-safe|motion-reduce|print|portrait|landscape|rtl|ltr|before|after|placeholder|file|marker|'
                     r'selection|backdrop|details-content|target|inert|contrast-more|forced-colors|pointer-coarse|pointer-fine|starting|\*|\*\*|'
                     r'(?:group|peer|has|not|in|aria|data|supports|nth|nth-last)(?:-[\w-]*?)?(?:\[[^\]]+\])?(?:/\w+)?|\[[^\]]+\])$')


@cache
def basecoat_classes():
    """Every class Basecoat 1.0.2 defines in what a project loads (basecoat.css and its imports, not the legacy layer)."""
    def loaded(path):
        text = path.read_text(encoding='utf-8')
        return text + ''.join(loaded((path.parent / name).resolve()) for name in re.findall(r'@import "([^"]+)"', text))
    css = re.sub(r'/\*.*?\*/', '', loaded(BASECOAT / 'basecoat.css'), flags=re.S)
    return frozenset(re.findall(r'\.(-?[A-Za-z_][\w-]*)', css))


@cache
def kit_classes():
    """App foundations (.app) and the game kit (.game, .game-*): the CSS the cards tell a project to add."""
    found = set()
    for path in (HERE / 'foundations/AppFoundations.css', HERE / 'game-blocks/GameKit.css'):
        if path.is_file(): found |= set(re.findall(r'\.(-?[A-Za-z_][\w-]*)', re.sub(r'/\*.*?\*/', '', path.read_text(encoding='utf-8'), flags=re.S)))
    return frozenset(found)


def split_variants(name):
    """'@3xl:hover:bg-muted/40' -> ['@3xl', 'hover'], 'bg-muted/40' (colons inside [...] do not split)."""
    parts, depth, current = [], 0, ''
    for char in name:
        if char == '[': depth += 1
        elif char == ']': depth -= 1
        if char == ':' and depth == 0: parts.append(current); current = ''
        else: current += char
    return parts, current


def utility(name):
    """The (family, value) of a Tailwind utility, or None when Tailwind would not make this class."""
    variants, base = split_variants(name)
    if any(not VARIANT.match(variant) for variant in variants): return None
    base = base.lstrip('!').removesuffix('!')
    negative = base.startswith('-'); base = base.lstrip('-')
    if base in WORDS or re.fullmatch(r'(?:group|peer)/[\w-]+', base): return (base, '')
    arbitrary = re.fullmatch(r'\[[^\]]+\]', base)
    if arbitrary: return ('[property]', base)  # [mask-type:luminance]
    for family in sorted(FAMILIES, key=len, reverse=True):
        if not base.startswith(family + '-'): continue
        value = base[len(family) + 1:]
        modifier = None
        if '/' in value and not re.fullmatch(r'\d+/\d+', value) and not value.startswith('['):
            value, modifier = value.rsplit('/', 1)
            if not re.fullmatch(r'\d+|\[[^\]]+\]', modifier): continue
        if re.fullmatch(r'\[[^\]]+\]|\([^)]+\)', value): return (family, value)
        if family in COLOUR_FAMILIES and (value in TOKENS or value in PLAIN or PALETTE_COLOUR.match(value)): return (family, value)
        if modifier is None and re.fullmatch(FAMILIES[family], value): return (family, value)
        if negative and re.fullmatch(FAMILIES[family], value): return (family, value)
    return None


def known(name, game=False):
    """Whether a project's CSS has this class: Basecoat, App foundations, the game kit or a Tailwind utility."""
    variants, base = split_variants(name)
    plain = base.lstrip('!')
    if not variants and (plain in basecoat_classes() or plain in kit_classes()): return True
    if variants and all(VARIANT.match(v) for v in variants) and (plain in basecoat_classes() or plain in kit_classes()): return True
    return utility(name) is not None


# The pre-1.0 Basecoat classes a model copies from old examples, with the 1.0 way to write them.
OLD = re.compile(r'^(btn|badge|alert|card)-(primary|secondary|outline|ghost|destructive|link|xs|sm|lg|icon|icon-sm)$')
COLOUR_PROPERTY = re.compile(r'(?:^|;)\s*(color|background(?:-color)?|border(?:-\w+)?-color|border|fill|stroke|outline-color|box-shadow)\s*:\s*([^;]+)', re.I)
COLOUR_VALUE = re.compile(r'#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(|\b(?:red|blue|green|yellow|orange|purple|pink|gray|grey|black|white|navy|teal)\b', re.I)
REMOTE = re.compile(r'^(?:https?:)?//(?!localhost[:/]|127\.0\.0\.1[:/])', re.I)
FIELD_TYPES_WITHOUT_LABEL = {'hidden', 'submit', 'button', 'reset', 'image'}
VIEWPORT = re.compile(r'^(?:max-)?(?:md|lg|xl|2xl)$')


class Page(html.parser.HTMLParser):
    """Collects what the rules need, with line numbers."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements, self.stack, self.labels_for, self.texts = [], [], set(), {}
        self.styles = []  # (line, css text) from <style> blocks
        self.in_style = None

    def handle_starttag(self, tag, attrs):
        attrs = {key: value or '' for key, value in attrs}
        element = {'tag': tag, 'attrs': attrs, 'line': self.getpos()[0], 'parents': [item['tag'] for item in self.stack],
                   'parent_classes': [item['attrs'].get('class', '') for item in self.stack], 'text': ''}
        self.elements.append(element)
        if tag == 'label' and attrs.get('for'): self.labels_for.add(attrs['for'])
        if tag == 'style': self.in_style = self.getpos()[0]
        if tag not in ('input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'col', 'area', 'base', 'wbr', 'track', 'embed'):
            self.stack.append(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1]['tag'] == tag: self.stack.pop()

    def handle_endtag(self, tag):
        if tag == 'style': self.in_style = None
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]['tag'] == tag: del self.stack[index:]; break

    def handle_data(self, data):
        if self.in_style: self.styles.append((self.in_style, data))
        for element in self.stack: element['text'] += data


def check_text(text, name='page'):
    """[(level, line, rule, message)] for one page's HTML (a Jinja template works too: {{ … }} is skipped)."""
    page = Page(); page.feed(text); page.close()
    findings = []
    def add(level, line, rule, message): findings.append((level, line, rule, message))
    game = 'class="game' in text
    for element in page.elements:
        tag, attrs, line = element['tag'], element['attrs'], element['line']
        # A Jinja template's {{ … }} and {% … %} inside class="" are the template's business, not class names.
        value = re.sub(r'\{\{.*?\}\}|\{%.*?%\}', ' ', attrs.get('class', ''))
        classes = [item for item in value.split() if not set(item) & set('{}%')]
        # class
        for item in classes:
            old = OLD.match(item)
            if old:
                attribute = 'data-size' if old.group(2) in ('xs', 'sm', 'lg', 'icon', 'icon-sm') else 'data-variant'
                add('error', line, 'class', f'class "{item}" is pre-1.0 Basecoat and renders as nothing. Write class="{old.group(1)}" {attribute}="{old.group(2)}".')
            elif not known(item, game):
                add('error', line, 'class', f'class "{item}" is not in Basecoat 1.0.2 and is not a Tailwind utility, so it does nothing. Use a class from the block’s card or a Tailwind utility (flex, grid, gap-4, p-4).')
            else:
                found = utility(item)
                if found and found[0] in COLOUR_FAMILIES and (PALETTE_COLOUR.match(found[1]) or found[1] in ('white', 'black') or re.fullmatch(r'\[(?:#|rgb|hsl|oklch).*\]', found[1])):
                    add('error', line, 'colour', f'class "{item}" hard-codes a colour. Use a theme token instead: bg-primary, text-muted-foreground, border-border, text-destructive (the person changes them in the theme panel).')
                variants, _ = split_variants(item)
                if any(VIEWPORT.match(variant) for variant in variants) and not any('sidebar' in parent for parent in element['parent_classes'] + [attrs.get('class', '')]) and 'dialog' not in element['parents'] + [tag]:
                    add('warning', line, 'breakpoint', f'class "{item}" uses a viewport breakpoint. Inside .app write the container one: @3xl: for the desktop layout, @max-3xl: for phone only.')
        if 'fixed' in classes and not any(word in attrs.get('class', '') for word in ('toaster',)) and 'dialog' not in element['parents'] + [tag] and any('app' in parent.split() for parent in element['parent_classes']):
            add('warning', line, 'fixed', 'position fixed inside .app: only dialogs and the toaster float. Make it the last flex child of .app (see BottomBar) so main scrolls.')
        # colour in style attributes and chart series
        for prop, value in COLOUR_PROPERTY.findall(attrs.get('style', '')):
            if COLOUR_VALUE.search(value) and 'var(' not in value:
                add('error', line, 'colour', f'style "{prop}: {value.strip()}" hard-codes a colour. Use a token: var(--primary), var(--muted-foreground), var(--chart-1) (or a class such as bg-muted).')
        series = attrs.get('data-chart-series', '')
        for value in re.findall(r'"color"\s*:\s*"([^"]+)"', series):
            if not value.startswith('var(--chart-'):
                add('error', line, 'colour', f'chart series colour "{value}" is hard-coded. Use var(--chart-1) … var(--chart-5): colour-blind safe, and they follow dark mode and the theme panel.')
        # cdn
        source = attrs.get('src', '') if tag in ('script', 'img', 'iframe') else attrs.get('href', '') if tag == 'link' else ''
        if tag in ('script', 'link', 'iframe') and REMOTE.match(source):
            add('error', line, 'cdn', f'<{tag}> loads {source} from the network. Apps work offline: copy the file into the project (python3 {{harness}}/kit/blocks/add.py <project> <Block> copies Basecoat and Chart.js) and link the local copy.')
        # label
        if tag in ('input', 'select', 'textarea') and attrs.get('type', '').lower() not in FIELD_TYPES_WITHOUT_LABEL:
            named = any(attrs.get(key) for key in ('aria-label', 'aria-labelledby', 'data-t-label', 'title')) or attrs.get('id') in page.labels_for or 'label' in element['parents']
            if not named:
                what = f'<{tag} id="{attrs["id"]}">' if attrs.get('id') else f'<{tag}{" name=" + chr(34) + attrs["name"] + chr(34) if attrs.get("name") else ""}>'
                add('error', line, 'label', f'{what} has no label. Add <label class="label" for="{attrs.get("id") or "the-id"}">…</label> (give the field that id), or aria-label with a data-t-label key.')
        if tag == 'canvas' and ('chart' in classes or 'data-chart-type' in attrs):
            if not (attrs.get('aria-label') or attrs.get('aria-labelledby')) or attrs.get('role') != 'img':
                add('error', line, 'chart', f'chart{" #" + attrs["id"] if attrs.get("id") else ""} has no words for a screen reader. Add role="img" and an aria-label that states the main finding ("Saturday is busiest with 83 orders").')
    # A button's text arrives after its start tag, so buttons are judged once the whole page is read.
    for element in page.elements:
        if element['tag'] == 'button' and not element['text'].strip() and not any(element['attrs'].get(key) for key in ('aria-label', 'aria-labelledby', 'data-t-label', 'title', 'data-t')):
            add('error', element['line'], 'label', 'a <button> with no text has no name. Add aria-label (with a data-t-label key) or a <span class="sr-only"> with the words.')
    charts = [element for element in page.elements if element['tag'] == 'canvas' and ('chart' in element['attrs'].get('class', '').split() or 'data-chart-type' in element['attrs'])]
    tables = [element for element in page.elements if element['tag'] == 'table']
    if len(tables) < len(charts):
        for element in charts[len(tables):] if tables else charts:
            add('error', element['line'], 'chart', f'chart{" #" + element["attrs"]["id"] if element["attrs"].get("id") else ""} has no table alternative. Add <details><summary data-t="chart.show_table">Show as a table</summary><table class="table">…</table></details> with the same numbers.')
    for line, css in page.styles:
        for match in re.finditer(r'@import\s+(?:url\()?["\']?((?:https?:)?//[^"\')\s]+)', css):
            if REMOTE.match(match.group(1)): add('error', line, 'cdn', f'@import loads {match.group(1)} from the network. Vendor the file (fonts: the theme panel stores Google Fonts locally) and import the local copy.')
    for match in re.finditer(r'url\(["\']?(https?://fonts\.(?:googleapis|gstatic)\.com[^"\')]*)', text):
        add('error', text[:match.start()].count('\n') + 1, 'cdn', f'{match.group(1)} loads a font from Google. Store fonts in the project (the theme panel downloads Google Fonts into it) and link them locally.')
    return sorted(set(findings), key=lambda item: (item[1], item[2], item[3]))


def check_file(path):
    return check_text(Path(path).read_text(encoding='utf-8'), str(path))


def main(argv):
    if not argv: print(__doc__.strip()); return 2
    failed = False
    for name in argv:
        try: findings = check_file(name)
        except OSError as error: print(f'{name}: cannot read ({error.strerror})'); failed = True; continue
        for level, line, rule, message in findings:
            print(f'{name}:{line}: {level} [{rule}] {message}')
        errors = sum(1 for item in findings if item[0] == 'error')
        failed |= errors > 0
        print(f'{name}: {errors} error{"" if errors == 1 else "s"}, {len(findings) - errors} warning{"" if len(findings) - errors == 1 else "s"}.')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
