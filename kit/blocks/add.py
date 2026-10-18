"""Set a project up for App Blocks (plan 266 item 7): the libraries they need, with licences, and their texts.

    python3 kit/blocks/add.py <project> <Name> [<Name> …]     # e.g. add.py . LogIn BarChart

Deterministic, so the model never types library paths: for each named card (and the cards an archetype or genre
lists), it copies what kit/blocks/index.json says the card needs into the project, keeping each licence beside it,
adds every text key the card lists to messages/en.json and messages/ja.json (a key the project already has is kept as
it is), and prints the lines to load the scripts, in order. Running it twice changes nothing.

Where the files go: the web starter serves static/ (so static/vendor/…), the no-server starter its own folder
(vendor/…); kit/starters.json's "identify" file tells them apart. Basecoat's styles are already in every starter
(vendor/basecoat/css); this adds Basecoat's script for interactive parts (vendor/basecoat/all.min.js), Chart.js
(vendor/chart.js-4.5.1/) and Basecoat's chart wrapper (vendor/basecoat/chart.min.js) when a card needs them.
"""
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIT = HERE.parent
BASECOAT = KIT / 'vendor/basecoat-1.0.2'
CHARTJS = KIT / 'vendor/chartjs-4.5.1'
# library -> [(source, path inside the served folder)], in load order.
FILES = {
    'basecoat-js': [(BASECOAT / 'js/all.min.js', 'vendor/basecoat/all.min.js'), (BASECOAT / 'LICENSE.md', 'vendor/basecoat/LICENSE.md')],
    'chart.js': [(CHARTJS / 'chart.umd.min.js', 'vendor/chart.js-4.5.1/chart.umd.min.js'), (CHARTJS / 'LICENSE.md', 'vendor/chart.js-4.5.1/LICENSE.md')],
    'basecoat-chart': [(BASECOAT / 'js/chart.min.js', 'vendor/basecoat/chart.min.js'), (BASECOAT / 'LICENSE.md', 'vendor/basecoat/LICENSE.md')],
}
LOAD_ORDER = [('chart.js', 'vendor/chart.js-4.5.1/chart.umd.min.js'), ('basecoat-js', 'vendor/basecoat/all.min.js'), ('basecoat-chart', 'vendor/basecoat/chart.min.js')]


def index():
    return json.loads((HERE / 'index.json').read_text(encoding='utf-8'))


def served_folder(project):
    """(folder the app serves, the URL prefix pages use), from the starter's identifying file."""
    starters = json.loads((KIT / 'starters.json').read_text(encoding='utf-8'))
    if (project / starters['web']['identify']).is_file(): return project / 'static', '/static/'
    if (project / starters['tui']['identify']).is_file(): raise ValueError('This is a terminal app (Textual): App Blocks are for web pages and games.')
    return project, ''


def expand(names, cards):
    """The named cards plus every card an archetype or genre uses and what each one assumes, in a stable order."""
    unknown = [name for name in names if name not in cards]
    if unknown:
        raise ValueError(f'No App Block called {", ".join(unknown)}. Use the exact names from kit/blocks/index.json (LogIn, BarChart, AppShop…).')
    chosen = []
    def visit(name):
        if name in chosen: return
        for required in cards[name]['requires']: visit(required)
        chosen.append(name)
        for used in cards[name]['uses']: visit(used)
    for name in names: visit(name)
    return chosen


def add(project, names):
    """Copy libraries and merge texts; returns what changed and the script lines, for the printed report."""
    project = Path(project).resolve()
    if not project.is_dir(): raise ValueError(f'{project} is not a folder.')
    data = index(); cards = {card['name']: card for card in data['cards']}
    chosen = expand(names, cards)
    needed = {library for name in chosen for library in cards[name]['libraries']}
    folder, prefix = served_folder(project) if needed - {'basecoat', 'littlejs'} else (project, '')
    copied = []
    for library, files in FILES.items():
        if library not in needed: continue
        for source, relative in files:
            target = folder / relative
            if target.is_file() and target.read_bytes() == source.read_bytes(): continue
            target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, target)
            copied.append(str(target.relative_to(project)))
    texts = json.loads((HERE / 'texts.json').read_text(encoding='utf-8'))['cards']
    added = {'en': 0, 'ja': 0}
    messages = project / 'messages'
    if any(name in texts for name in chosen) and messages.is_dir():
        for position, language in enumerate(('en', 'ja')):
            path = messages / f'{language}.json'
            current = json.loads(path.read_text(encoding='utf-8')) if path.is_file() else {}
            for name in chosen:
                for key, values in texts.get(name, {}).items():
                    if key not in current: current[key] = values[position]; added[language] += 1
            if added[language]: path.write_text(json.dumps(current, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    # No defer: a chart block's own script calls basecoat.chart() as soon as it is read, and the wrapper registers itself
    # on window.basecoat, so the three load in this order before any block script.
    scripts = [f'<script src="{prefix}{relative}"></script>' for library, relative in LOAD_ORDER if library in needed]
    notes = []
    if 'littlejs' in needed: notes.append('Games: LittleJS comes with the gaming-core scaffold (python3 -B tools/game.py init emptyGame --out <project>); GameKit’s card has the HTML layer.')
    if scripts: notes.append('Put them at the end of <body>, before the page\u2019s own scripts' + (', and remove /static/basecoat.min.js from app/templates/base.html (all.min.js includes it).' if prefix == '/static/' else '.'))
    return {'cards': chosen, 'copied': copied, 'texts': added, 'scripts': scripts, 'notes': notes,
            'markup': [path for name in chosen for path in cards[name]['code']]}


def main(argv):
    if len(argv) < 2: print(__doc__.strip()); return 2
    try: result = add(argv[0], argv[1:])
    except ValueError as error: print(error); return 1
    print('Cards: ' + ', '.join(result['cards']))
    print('Copied: ' + (', '.join(result['copied']) or 'nothing new (already there)'))
    print(f"Texts added: {result['texts']['en']} to messages/en.json, {result['texts']['ja']} to messages/ja.json")
    if result['scripts']: print('Load in this order, once per page, without defer:\n' + '\n'.join('  ' + line for line in result['scripts']))
    for note in result['notes']: print(note)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
