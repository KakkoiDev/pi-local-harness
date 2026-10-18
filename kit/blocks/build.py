"""App Blocks as cards Pi loads one at a time (plan 266 item 7).

    python3 kit/blocks/build.py            # rebuild kit/blocks/ from design/app-blocks/components/*/README.md
    python3 kit/blocks/build.py --check    # exit 1 if the committed cards differ from a fresh build

The designer's catalogue (design/app-blocks, synced from claude.ai) is the source; this script is the only writer of
kit/blocks/<group>/<Name>.md (the card), the code files next to it (<Name>.html, <Name>.css, <Name>.js; a second block
of the same language is <Name>.2.html and so on), index.json (what routing, the app_block tool and Project Start read)
and texts.json (every text key in English and Japanese, which add.py merges into a project). The only hand-written
input here is keywords.json (the words, in English and Japanese, that route a request to a card). Same input, same
bytes: a re-sync of design/app-blocks without a rebuild fails tests/test_app_blocks.py.

A card keeps what a small model needs to build the block (facts, states, texts, keyboard and focus, phone, data, what
not to invent) and points at the code files instead of carrying the markup, so Pi copies exact markup rather than
re-typing it. Paths in cards are written {harness}/kit/blocks/…; harness/blocks.mjs fills in the harness folder.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SOURCE = ROOT / 'design/app-blocks/components'

# The designer's groups (design/app-blocks/README.md, "The catalogue") and the folder each one's cards go in.
GROUPS = {
    'Foundations': 'foundations', 'Accounts': 'accounts', 'Navigation': 'navigation', 'Data': 'data',
    'Feedback': 'feedback', 'Content': 'content', 'App shell': 'app-shell', 'Sharing and people': 'people',
    'Charts': 'charts', 'Commerce': 'commerce', 'Collaboration': 'collaboration', 'Other elements': 'elements',
    'Game blocks': 'game-blocks', 'Apps': 'apps', 'Games': 'games', 'Art': 'art',
}
KINDS = {'Foundations': 'foundation', 'Apps': 'archetype', 'Games': 'genre', 'Art': 'art'}
EXTENSIONS = {'html': 'html', 'css': 'css', 'js': 'js'}
# Sections whose code is copied into files (the rest, Data and Recipe fields, stays in the card: it is short JSON).
CODE_SECTIONS = {'Markup', 'The page', 'The stylesheet', 'App foundations CSS'}
# Basecoat components that need its script (kit/vendor/basecoat-1.0.2/js/all.min.js) to open, switch or close.
INTERACTIVE = {'dropdown-menu', 'popover', 'tabs', 'toaster', 'toast', 'sidebar', 'command', 'combobox'}
PREVIEW_CHROME = re.compile(r' \((?:see the preview|as in the preview)\)')
LIBRARIES = {
    'basecoat': {'version': '1.0.2', 'license': 'MIT', 'files': ['kit/vendor/basecoat-1.0.2/css', 'kit/vendor/basecoat-1.0.2/LICENSE.md'],
                 'what': 'the styles every app block uses (vega style)'},
    'basecoat-js': {'version': '1.0.2', 'license': 'MIT', 'files': ['kit/vendor/basecoat-1.0.2/js/all.min.js', 'kit/vendor/basecoat-1.0.2/LICENSE.md'],
                    'what': 'Basecoat’s script for its interactive parts (menus, popovers, tabs, selects, toasts, the sidebar)'},
    'chart.js': {'version': '4.5.1', 'license': 'MIT', 'files': ['kit/vendor/chartjs-4.5.1/chart.umd.min.js', 'kit/vendor/chartjs-4.5.1/LICENSE.md'],
                 'what': 'the chart library'},
    'basecoat-chart': {'version': '1.0.2', 'license': 'MIT', 'files': ['kit/vendor/basecoat-1.0.2/js/chart.min.js', 'kit/vendor/basecoat-1.0.2/LICENSE.md'],
                       'what': 'Basecoat’s chart wrapper, basecoat.chart(); load after Chart.js and Basecoat’s script'},
    'littlejs': {'version': '1.27.0', 'license': 'MIT', 'files': ['kit/vendor/littlejs-1.27.0'],
                 'what': 'the game engine, as gaming-core scaffolds it (tools/game.py init)'},
}


def sections(text):
    """(title, body) in order; the part before the first '## ' is the head (title, summary, facts)."""
    parts = re.split(r'^## (.+)$', text, flags=re.M)
    return [('', parts[0])] + [(parts[i].strip(), parts[i + 1]) for i in range(1, len(parts), 2)]


def facts(head):
    """The facts table under the summary: {'Group': 'Accounts', 'Basecoat': '`card`, …', …}."""
    found = {}
    for key, value in re.findall(r'^\| ([^|]+?) \| (.*) \|$', head, flags=re.M):
        if key.strip() and set(key.strip()) != {'-'}: found.setdefault(key.strip(), value.strip())
    return found


def names(value, known):
    """Card names listed in a facts cell (Blocks, Game blocks, Links to), in order, only real cards."""
    return list(dict.fromkeys(word for word in re.findall(r'[A-Z][A-Za-z]+', value or '') if word in known))


def compact_table(lines):
    """A Markdown table as short lines: two columns become '- a: b'; more keep their cells with ' | '."""
    rows = [[cell.strip() for cell in line.strip().strip('|').split(' | ')] for line in lines]
    rows = [row for row in rows if not all(set(cell) <= set('-: ') for cell in row)]
    if not rows: return []
    header, body = rows[0], rows[1:]
    if not body: return ['- ' + ' | '.join(header)]
    out = [] if len(header) == 2 and header[0] in ('State', 'Thing', 'Case', 'Key') else [f"({' | '.join(header)})"]
    for row in body:
        out.append(f'- {row[0]}: ' + ' | '.join(row[1:]) if len(row) > 1 else f'- {row[0]}')
    return out


def compact(body):
    """Tables become short lines; blank-line runs collapse; trailing spaces go."""
    out, table = [], []
    for line in body.splitlines():
        if line.lstrip().startswith('|') and line.rstrip().endswith('|'):
            table.append(line); continue
        if table: out.extend(compact_table(table)); table = []
        out.append(line.rstrip())
    if table: out.extend(compact_table(table))
    text = re.sub(r'\n{3,}', '\n\n', '\n'.join(out)).strip()
    return PREVIEW_CHROME.sub('', text)


def texts_of(body):
    """The Texts table: {key: [English, Japanese]}."""
    found = {}
    for key, english, japanese in re.findall(r'^\| `([^`]+)` \| (.*?) \| (.*?) \|$', body, flags=re.M):
        found[key] = [english.strip(), japanese.strip()]
    return found


def classes_of(html):
    return {name for value in re.findall(r'class="([^"]*)"', html) for name in value.split() if '{' not in name}


def build_one(name, text, known, keywords):
    """One card: (index entry, {relative path: file text}, texts)."""
    parts = sections(text)
    head = parts[0][1]
    summary = next((line.strip() for line in head.splitlines()[1:] if line.strip() and not line.startswith('|')), '')
    fact = facts(head)
    group = fact.get('Group', '')
    if group not in GROUPS: raise SystemExit(f'{name}: unknown group {group!r} (add it to GROUPS in kit/blocks/build.py)')
    folder = GROUPS[group]; kind = KINDS.get(group, 'block')
    files, counts, code = {}, {}, {'html': '', 'css': '', 'js': ''}
    card = [f'# {name}', '', f'App Block card ({group}). {summary}', '']
    for key, value in fact.items():
        if key != 'Group': card.append(f'- {key}: {value}')
    texts = {}
    for title, body in parts[1:]:
        if title == 'Texts': texts = texts_of(body)
        if title in CODE_SECTIONS:
            def extract(match):
                language = EXTENSIONS.get(match.group(1), 'txt'); counts[language] = counts.get(language, 0) + 1
                suffix = '' if counts[language] == 1 else f'.{counts[language]}'
                relative = f'{folder}/{name}{suffix}.{language}'
                content = match.group(2).rstrip() + '\n'
                files[relative] = content; code[language] += content
                lines = content.count('\n')
                return f'Copy, never retype: `{{harness}}/kit/blocks/{relative}` ({lines} line{"" if lines == 1 else "s"} of {language.upper()}).'
            body = re.sub(r'^```(\w*)\n(.*?)^```$', extract, body, flags=re.M | re.S)
        card += ['', f'## {title}', compact(body)]
    entry_libraries = libraries_for(kind, group, code['html'] + code['js'])
    if kind in ('foundation', 'art') or name == 'GameKit': requires = []
    else: requires = ['GameKit'] if 'littlejs' in entry_libraries else ['AppFoundations']
    uses = names(fact.get('Blocks') or fact.get('Game blocks'), known) if kind in ('archetype', 'genre') else []
    card += ['', '## Pi Workbench']
    if requires: card.append(f'- Assumes {requires[0]} (its card comes with this one).')
    if uses: card.append('- Load a block’s card with the app_block tool and its exact name, one at a time: ' + ', '.join(uses) + '.')
    if kind != 'art':
        card.append(f'- Set up: `python3 {{harness}}/kit/blocks/add.py <project> {name}` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.')
    if code['html']:
        card.append('- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).')
    card_path = f'{folder}/{name}.md'
    files[card_path] = '\n'.join(card).rstrip() + '\n'
    words = keywords.get(name, {})
    entry = {
        'name': name, 'group': group, 'kind': kind, 'purpose': summary,
        'keywords': {'en': words.get('en', []), 'ja': words.get('ja', [])}, 'weak': words.get('weak', []),
        'card': f'kit/blocks/{card_path}', 'code': [f'kit/blocks/{path}' for path in files if path != card_path],
        'libraries': entry_libraries, 'requires': requires, 'uses': uses,
        'links': names(fact.get('Links to'), known), 'texts': len(texts), 'size': len(files[card_path]),
    }
    return entry, files, texts


def libraries_for(kind, group, code):
    if group in ('Game blocks', 'Games'): return ['littlejs']
    if kind == 'art': return []
    found = ['basecoat']
    classes = classes_of(code)
    charts = 'data-chart-type' in code or 'basecoat.chart(' in code
    if charts or classes & INTERACTIVE or re.search(r'<div[^>]*class="[^"]*\bselect\b', code): found.append('basecoat-js')
    if charts: found += ['chart.js', 'basecoat-chart']
    return found


def build():
    """Every output file: {path relative to kit/blocks: text}."""
    keywords = json.loads((HERE / 'keywords.json').read_text(encoding='utf-8'))['cards']
    readmes = {path.parent.name: path.read_text(encoding='utf-8') for path in sorted(SOURCE.glob('*/README.md')) if path.parent.name != 'Cover'}
    unknown = sorted(set(keywords) - set(readmes))
    if unknown: raise SystemExit(f'keywords.json names cards the catalogue does not have: {", ".join(unknown)}')
    entries, out, texts = [], {}, {}
    for name, text in readmes.items():
        entry, files, card_texts = build_one(name, text, set(readmes), keywords)
        entries.append(entry); out.update(files)
        if card_texts: texts[name] = card_texts
    # Who uses a block: the archetypes and genres that list it; an archetype needs every library its blocks need.
    by_name = {entry['name']: entry for entry in entries}
    for entry in entries:
        entry['used_by'] = [other['name'] for other in entries if entry['name'] in other['uses']]
        if entry['uses']:
            needed = set(entry['libraries']).union(*(by_name[name]['libraries'] for name in entry['uses']))
            entry['libraries'] = [name for name in LIBRARIES if name in needed]
    index = {
        'note': 'Generated by kit/blocks/build.py from design/app-blocks (the designer’s App Blocks); do not edit. '
                'Keywords come from kit/blocks/keywords.json. Paths are relative to the harness folder.',
        'source': 'design/app-blocks/components', 'count': len(entries),
        'libraries': LIBRARIES, 'groups': {group: f'kit/blocks/{folder}' for group, folder in GROUPS.items()},
        'cards': entries,
    }
    out['index.json'] = json.dumps(index, ensure_ascii=False, indent=1) + '\n'
    out['texts.json'] = json.dumps({'note': 'Generated by kit/blocks/build.py: every text key of every card, [English, Japanese].', 'cards': texts}, ensure_ascii=False, indent=1) + '\n'
    return out


def generated():
    """The files build() owns now on disk (so a card the designer removed is removed too)."""
    found = {str(path.relative_to(HERE)) for folder in GROUPS.values() for path in (HERE / folder).glob('*') if path.is_file()}
    return found | {name for name in ('index.json', 'texts.json') if (HERE / name).exists()}


def main(argv):
    out = build()
    if '--check' in argv:
        stale = sorted(path for path, text in out.items() if not (HERE / path).is_file() or (HERE / path).read_text(encoding='utf-8') != text)
        extra = sorted(generated() - set(out))
        if stale or extra:
            print('kit/blocks is out of date; run python3 kit/blocks/build.py\n' + '\n'.join(stale + extra)); return 1
        print(f'kit/blocks is current: {len(out)} files.'); return 0
    for path in generated() - set(out): (HERE / path).unlink()
    for path, text in out.items():
        target = HERE / path; target.parent.mkdir(parents=True, exist_ok=True)
        if not target.is_file() or target.read_text(encoding='utf-8') != text: target.write_text(text, encoding='utf-8')
    print(f'Wrote kit/blocks: {sum(1 for path in out if path.endswith(".md"))} cards, {len(out)} files.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
