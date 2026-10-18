"""Plan 266 item 7 (task 317): the designer's App Blocks as cards Pi loads one at a time, the tool that sets a project up
for them, and the checker for generated pages. The cards are built from design/app-blocks by kit/blocks/build.py, so a
re-sync of the designer's catalogue without a rebuild fails here."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parent.parent
BLOCKS = ROOT / 'kit/blocks'
sys.path.insert(0, str(BLOCKS))
import add as blocks_add  # noqa: E402
import build  # noqa: E402
import check  # noqa: E402

# What the checker finds in the designer's own markup. Round 12 part A had 17 errors (design/briefs/round-13.md); round 13
# fixed them all, with the state colours (success, warning, highlight) added to the checker's tokens. A new error fails
# the test until it is fixed in the catalogue or the checker.
DESIGN_FINDINGS = set()


def index():
    return json.loads((BLOCKS / 'index.json').read_text(encoding='utf-8'))


class BuildTest(unittest.TestCase):
    def test_the_build_is_deterministic_and_the_committed_cards_are_current(self):
        first, second = build.build(), build.build()
        self.assertEqual(first, second, 'the same catalogue gives the same bytes')
        stale = sorted(path for path, text in first.items() if not (BLOCKS / path).is_file() or (BLOCKS / path).read_text(encoding='utf-8') != text)
        self.assertEqual(stale, [], 'design/app-blocks changed without a rebuild: run python3 kit/blocks/build.py')
        self.assertEqual(sorted(build.generated() - set(first)), [], 'a card the catalogue no longer has is still in kit/blocks')
        done = subprocess.run([sys.executable, str(BLOCKS / 'build.py'), '--check'], capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stdout)

    def test_every_card_is_indexed_with_stable_paths_and_its_files_exist(self):
        data = index(); cards = {card['name']: card for card in data['cards']}
        catalogue = {path.parent.name for path in (ROOT / 'design/app-blocks/components').glob('*/README.md')} - {'Cover'}
        self.assertEqual(set(cards), catalogue); self.assertEqual(data['count'], 151)
        for card in data['cards']:
            self.assertEqual(card['card'], f"kit/blocks/{build.GROUPS[card['group']]}/{card['name']}.md", 'paths Project Start refers to')
            for path in [card['card'], *card['code']]: self.assertTrue((ROOT / path).is_file(), path)
            self.assertTrue(card['purpose'] and card['keywords']['en'] and card['keywords']['ja'], card['name'])
            for name in card['requires'] + card['uses'] + card['links']: self.assertIn(name, cards, card['name'])
            self.assertTrue(set(card['libraries']) <= set(data['libraries']), card['name'])
            if card['kind'] == 'block' and card['name'] != 'GameKit': self.assertIn(card['requires'], (['AppFoundations'], ['GameKit']), card['name'])
            self.assertNotIn('```html', (ROOT / card['card']).read_text(), 'a card points at its markup file instead of carrying it')
        for name in ('AppShop', 'GameRpg'): self.assertTrue(cards[name]['uses'], name)
        self.assertIn('Cart', cards['AppShop']['uses']); self.assertIn('DialogueBox', cards['GameRpg']['uses'])
        self.assertEqual(cards['BarChart']['libraries'], ['basecoat', 'basecoat-js', 'chart.js', 'basecoat-chart'])
        self.assertEqual(cards['GameRpg']['libraries'], ['littlejs']); self.assertEqual(cards['ArtPalettes']['libraries'], [])
        for library in data['libraries'].values():
            for path in library['files']: self.assertTrue((ROOT / path).exists(), path)

    def test_a_card_keeps_what_a_small_model_needs_and_drops_preview_chrome(self):
        card = (BLOCKS / 'accounts/LogIn.md').read_text(encoding='utf-8')
        for part in ('## States', '## Texts', '`login.title`: Log In | ログイン', '## Keyboard and focus', '## Phone', '## Data', "## Don't",
                     'Copy, never retype: `{harness}/kit/blocks/accounts/LogIn.html`', 'kit/blocks/add.py <project> LogIn'):
            self.assertIn(part, card)
        markup = (BLOCKS / 'accounts/LogIn.html').read_text(encoding='utf-8')
        self.assertIn('<form id="login-form" class="card w-full max-w-sm"', markup)
        self.assertNotIn('(see the preview)', ''.join(path.read_text(encoding='utf-8') for path in BLOCKS.glob('*/*.md')))
        texts = json.loads((BLOCKS / 'texts.json').read_text(encoding='utf-8'))['cards']
        self.assertEqual(texts['LogIn']['login.title'], ['Log In', 'ログイン'])


class MarkupTest(unittest.TestCase):
    def test_every_class_the_block_markup_uses_is_basecoat_the_kit_or_a_tailwind_utility(self):
        unknown = {}
        for path in sorted(BLOCKS.glob('*/*.html')):
            for name in sorted(build.classes_of(path.read_text(encoding='utf-8'))):
                if not check.known(name): unknown.setdefault(name, []).append(path.name)
        self.assertEqual(unknown, {}, 'every class is Basecoat, the kit or a Tailwind utility (round 13 dropped DetailView\u2019s prose-sm)')

    def test_every_card_s_markup_passes_the_checker_with_no_errors(self):
        found = {(path.name, rule) for path in sorted(BLOCKS.glob('*/*.html')) for level, _line, rule, _message in check.check_file(path) if level == 'error'}
        self.assertEqual(found - DESIGN_FINDINGS, set(), 'new errors in the designer’s markup')
        self.assertEqual(DESIGN_FINDINGS, set(), 'round 13: the designer’s catalogue has no known errors left')
        for name in ('success', 'success-foreground', 'warning', 'warning-foreground', 'highlight', 'highlight-foreground'):
            self.assertTrue(check.known(f'bg-{name}') and check.known(f'dark:text-{name}'), name)

    def test_the_charts_card_teaches_the_designer_s_wrapper_and_its_example_passes_the_checker(self):
        card = (ROOT / 'kit/cards/charts.md').read_text(encoding='utf-8')
        self.assertIn('basecoat.chart(', card); self.assertIn('kit/vendor/basecoat-1.0.2/js/chart.min.js', card); self.assertIn('var(--chart-1)', card)
        example = re.search(r'```html\n(.*?)```', card, re.S).group(1).replace('…the same numbers…', '<tr><th>Jan</th><td>12</td></tr>')
        self.assertEqual([item for item in check.check_text(example) if item[0] == 'error'], [])

    def test_the_basecoat_class_list_is_what_a_project_loads(self):
        names = check.basecoat_classes()
        for name in ('btn', 'card', 'field', 'input', 'table', 'alert', 'sidebar', 'chart', 'chart-legend', 'chart-tooltip', 'toaster'):
            self.assertIn(name, names)
        self.assertNotIn('btn-outline', names, 'the legacy layer is not loaded')


GOOD = '''<main class="app grid gap-4 p-4 @3xl:grid-cols-2">
  <div class="field"><label class="label" for="email" data-t="login.email">Email</label><input class="input" id="email" type="email"></div>
  <button class="btn" data-variant="outline" data-t="save">Save</button>
  <button class="btn" data-size="icon" aria-label="Close" data-t-label="close"><svg aria-hidden="true"></svg></button>
  <section class="card"><canvas id="c" class="chart aspect-video" role="img" aria-label="Sales rise." data-chart-type="bar"
    data-chart-series='{"v":{"label":"Sales","color":"var(--chart-1)"}}'></canvas>
    <details><summary>Show as a table</summary><table class="table"><tr><th>Mon</th><td>3</td></tr></table></details></section>
  <p class="text-muted-foreground bg-muted/40 hover:bg-accent">Fine</p>
</main>
<script src="vendor/chart.js-4.5.1/chart.umd.min.js"></script>'''


class CheckerTest(unittest.TestCase):
    def rules(self, text):
        return [(level, rule) for level, _line, rule, _message in check.check_text(text)]

    def test_a_page_built_from_the_blocks_passes(self):
        self.assertEqual(check.check_text(GOOD), [])
        jinja = '<p class="badge {{ \'hidden\' if done else \'\' }} {% if x %}grid{% endif %}">{{ t("k") }}</p>'
        self.assertEqual(check.check_text(jinja), [], 'Jinja in a template is not a class name')

    def test_each_listed_mistake_is_caught_with_a_fix_a_small_model_can_act_on(self):
        cases = {
            'class': ['<button class="btn-outline">X</button>', '<form class="form grid"></form>', '<p class="text-foo">x</p>'],
            'label': ['<input class="input" id="name">', '<select class="select"></select>', '<button class="btn"></button>'],
            'chart': ['<canvas class="chart" role="img" aria-label="Up." data-chart-type="line"></canvas>',
                      '<canvas class="chart" data-chart-type="line"></canvas><table class="table"></table>'],
            'colour': ['<p class="bg-blue-500">x</p>', '<p class="text-[#ff0000]">x</p>', '<p style="color: #333">x</p>',
                       '<canvas class="chart" role="img" aria-label="x" data-chart-series=\'{"a":{"color":"#0072b2"}}\'></canvas><table class="table"></table>'],
            'cdn': ['<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">',
                    '<style>@import url("https://fonts.googleapis.com/css2?family=Inter");</style>'],
        }
        for rule, pages in cases.items():
            for page in pages:
                self.assertIn(('error', rule), self.rules(page), page)
        message = check.check_text('<button class="btn-outline">X</button>')[0][3]
        self.assertIn('class="btn" data-variant="outline"', message)
        message = check.check_text('<input class="input" id="name">')[0][3]
        self.assertIn('<label class="label" for="name">', message)
        self.assertIn(('warning', 'breakpoint'), self.rules('<main class="app"><div class="md:flex">x</div></main>'))
        self.assertIn(('warning', 'fixed'), self.rules('<div class="app"><nav class="fixed bottom-0">x</nav></div>'))

    def test_the_starters_pages_pass(self):
        pages = [*(ROOT / 'kit/starter/app/templates').rglob('*.html'), ROOT / 'kit/starter-static/index.html']
        self.assertEqual([(page.name, finding) for page in pages for finding in check.check_file(page)], [])

    def test_the_command_reports_lines_and_fails_only_on_errors(self):
        with tempfile.TemporaryDirectory() as folder:
            bad, good = Path(folder) / 'bad.html', Path(folder) / 'good.html'
            bad.write_text('<p>x</p>\n<button class="btn-sm">Go</button>\n'); good.write_text(GOOD)
            done = subprocess.run([sys.executable, str(BLOCKS / 'check.py'), str(bad)], capture_output=True, text=True)
            self.assertEqual(done.returncode, 1); self.assertIn(f'{bad}:2: error [class]', done.stdout)
            self.assertEqual(subprocess.run([sys.executable, str(BLOCKS / 'check.py'), str(good)], capture_output=True, text=True).returncode, 0)


class AddTest(unittest.TestCase):
    def project(self, folder, static=False):
        sys.path.insert(0, str(ROOT / 'kit'))
        from new_project import new_project
        return new_project(Path(folder) / 'app', static=static)

    def test_a_chart_block_gets_chart_js_and_basecoat_s_wrapper_with_licences_in_a_web_project(self):
        with tempfile.TemporaryDirectory() as folder:
            project = self.project(folder)
            result = blocks_add.add(project, ['BarChart'])
            self.assertEqual(result['cards'], ['AppFoundations', 'BarChart'])
            for path, source in (('static/vendor/chart.js-4.5.1/chart.umd.min.js', 'kit/vendor/chartjs-4.5.1/chart.umd.min.js'), ('static/vendor/chart.js-4.5.1/LICENSE.md', 'kit/vendor/chartjs-4.5.1/LICENSE.md'),
                                 ('static/vendor/basecoat/chart.min.js', 'kit/vendor/basecoat-1.0.2/js/chart.min.js'), ('static/vendor/basecoat/all.min.js', 'kit/vendor/basecoat-1.0.2/js/all.min.js'),
                                 ('static/vendor/basecoat/LICENSE.md', 'kit/vendor/basecoat-1.0.2/LICENSE.md')):
                self.assertEqual((project / path).read_bytes(), (ROOT / source).read_bytes(), path)
            self.assertEqual(result['scripts'], ['<script src="/static/vendor/chart.js-4.5.1/chart.umd.min.js"></script>', '<script src="/static/vendor/basecoat/all.min.js"></script>', '<script src="/static/vendor/basecoat/chart.min.js"></script>'])
            english = json.loads((project / 'messages/en.json').read_text()); japanese = json.loads((project / 'messages/ja.json').read_text())
            self.assertEqual((english['chart.orders.title'], japanese['chart.orders.title']), ('Orders per day', '曜日別の注文数'))
            self.assertEqual(english['app.name'], 'Notes', 'existing keys are kept')
            self.assertEqual(set(english), set(japanese))
            again = blocks_add.add(project, ['BarChart'])
            self.assertEqual((again['copied'], again['texts']), ([], {'en': 0, 'ja': 0}), 'running it twice changes nothing')

    def test_a_no_server_project_gets_them_beside_its_page_and_unknown_names_are_refused(self):
        with tempfile.TemporaryDirectory() as folder:
            project = self.project(folder, static=True)
            result = blocks_add.add(project, ['LineChart'])
            self.assertTrue((project / 'vendor/chart.js-4.5.1/chart.umd.min.js').is_file()); self.assertTrue((project / 'vendor/basecoat/chart.min.js').is_file())
            self.assertEqual(result['scripts'][0], '<script src="vendor/chart.js-4.5.1/chart.umd.min.js"></script>')
            plain = blocks_add.add(project, ['LogIn'])
            self.assertEqual(plain['scripts'], ['<script src="vendor/basecoat/all.min.js"></script>'], 'no chart: Basecoat\u2019s script only (AppFoundations has the toaster)')
            with self.assertRaisesRegex(ValueError, 'No App Block called Login2'): blocks_add.add(project, ['Login2'])
            shop = blocks_add.add(project, ['AppShop'])
            self.assertIn('Cart', shop['cards']); self.assertEqual(shop['cards'][0], 'AppFoundations')


class ClassifierTest(unittest.TestCase):
    def test_the_classifier_picks_among_the_few_candidates_and_never_asks_the_person(self):
        from harness import laya
        from harness.judgements import Judgements
        classifier = Mock(); classifier.ask.return_value = {'answer': 'SettingsPage', 'confidence': .97, 'abstained': False}
        result = laya.app_block('fix the settings', ['SettingsPage', 'GameSettings'], classifier=classifier)
        self.assertEqual(result['answer'], 'SettingsPage')
        self.assertEqual(classifier.ask.call_args.kwargs['options'], ['SettingsPage', 'GameSettings', 'none'])
        paperwork = Mock(); paperwork.data = None; judge = Judgements(paperwork, classifier)
        classifier.ask.return_value = {'answer': None, 'confidence': .4, 'abstained': True}
        result = judge.decide('r', 'app_block', ['fix the settings', ['SettingsPage']])
        self.assertIsNone(result['answer']); paperwork.choice_pending.assert_not_called()
        classifier.ask.return_value = {'answer': 'none', 'confidence': .99, 'abstained': False}
        self.assertIsNone(judge.decide('r', 'app_block', ['fix the settings', ['SettingsPage']])['answer'])

    def test_a_laya_pick_is_logged_with_its_author(self):
        from harness.judgements import Judgements
        with tempfile.TemporaryDirectory() as folder:
            classifier = Mock(); classifier.ask.return_value = {'answer': 'DataTable', 'confidence': .97, 'abstained': False}
            paperwork = Mock(); paperwork.data = Path(folder); paperwork.requests = {}
            Judgements(paperwork, classifier).decide('r', 'app_block', ['a table of orders', ['DataTable']])
            row = json.loads((Path(folder) / 'decisions.jsonl').read_text().splitlines()[-1])
            self.assertEqual((row['kind'], row['who'], row['answer']), ('app_block', 'laya', 'DataTable'))


class KeywordsTest(unittest.TestCase):
    def test_keywords_are_lowercase_and_weak_words_are_keywords(self):
        cards = json.loads((BLOCKS / 'keywords.json').read_text(encoding='utf-8'))['cards']
        for name, words in cards.items():
            for word in words['en'] + words['ja']: self.assertEqual(word, word.lower(), name)
            self.assertTrue(set(words.get('weak', [])) <= set(words['en'] + words['ja']), name)
            self.assertFalse([word for word in words['en'] if re.search(r'[^\x00-\x7f]', word)], f'{name}: Japanese words go in ja')


if __name__ == '__main__':
    unittest.main()
