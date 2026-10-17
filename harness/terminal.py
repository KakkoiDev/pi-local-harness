"""Console output as the TerminalOutput card draws it (round 6, task 171), in plain text: the command line and Pi's
harness tool read this. harness/terminal-render.mjs draws the same view in terminal Pi with bold and dim, at the
terminal's width; tests/fixtures/terminal-views.json keeps the two in step.

A view: {title, summary?, parts: [part], hint?}. Parts:
  {kind: 'kv', rows: [[label, value]]}
  {kind: 'table', columns: [name], rows: [[cell]], flex: column index that shortens, drop: [column indexes, first dropped first], dim: [indexes]}
  {kind: 'checklist', items: [{state: 'ok'|'fix'|'note', label, detail, fix?}]}
  {kind: 'prose', text}
  {kind: 'lines', lines: [text]}            (verbatim, e.g. a task record)
"""
import locale
import sys

GLYPH = {'completed': '✓', 'failed': '✗', 'attention': '!', 'running': '▶', 'waiting': '○', 'stopped': '■', 'interrupted': '~',
         'escalated': '?', 'in use': '●'}
ASCII = {'✓': 'ok', '✗': 'NO', '!': '!!', '▶': '>', '○': 'o', '■': '#', '●': '*', '─': '-', '═': '=', '│': '|', '→': '->', '…': '...', '·': '-'}
STATE = {'running': '▶ Running', 'queued': '○ Waiting', 'completed': '✓ Completed', 'failed': '✗ Failed', 'stopped': '■ Stopped',
         'interrupted': '~ Interrupted', 'cancelled': '■ Cancelled', 'waiting': '○ Waiting for you'}
CHECK = {'ok': '✓ ok  ', 'fix': '✗ fix ', 'note': '! note'}


def utf8():
    return 'utf' in (sys.stdout.encoding or locale.getpreferredencoding(False) or '').lower()


def cut(text, width):
    text = str(text)
    return text if len(text) <= width else text[:max(0, width - 1)] + '…'


def wrap(text, width):
    """Greedy word wrap, the same in harness/terminal-render.mjs (a word longer than the width stays whole)."""
    lines, line = [], ''
    for word in text.split():
        if line and len(line) + 1 + len(word) > width: lines.append(line); line = word
        else: line = f'{line} {word}' if line else word
    return lines + [line] if line else lines or ['']


def table_lines(part, width):
    """Header, ═, rows. Columns drop right to left (part['drop']) under 80; the flex column shortens to fit."""
    columns, rows = list(part['columns']), [list(map(str, row)) for row in part['rows']]
    keep = list(range(len(columns)))
    for index in part.get('drop', []):
        if width < 78 and index in keep and len(keep) > 2: keep.remove(index)
    widths = {i: max([len(columns[i])] + [len(row[i]) for row in rows]) for i in keep}
    flex = part.get('flex', keep[-1]) if part.get('flex', keep[-1]) in keep else keep[-1]
    caps = part.get('caps', {})
    for i in keep:
        if str(i) in caps: widths[i] = min(widths[i], caps[str(i)])
    room = width - 2 * (len(keep) - 1)
    over = sum(widths.values()) - room
    if over > 0: widths[flex] = max(len(columns[flex]), widths[flex] - over)
    line = lambda cells: '  '.join(cut(cells[i], widths[i]).ljust(widths[i]) for i in keep).rstrip()
    return [line(columns), '═' * min(width, sum(widths.values()) + 2 * (len(keep) - 1))] + [line(row) for row in rows]


def body(part, width):
    kind = part['kind']
    if kind == 'kv':
        pad = max((len(label) for label, _ in part['rows']), default=0) + 3
        return [label.ljust(pad) + str(value) for label, value in part['rows']]
    if kind == 'table':
        return table_lines(part, width) if part['rows'] else [part.get('empty', '(none)')]
    if kind == 'checklist':
        pad = max((len(item['label']) for item in part['items']), default=0) + 2
        lines = []
        for item in part['items']:
            lines.append(f"{CHECK[item['state']]}  {item['label'].ljust(pad)}{item['detail']}")
            if item.get('fix'): lines.append(' ' * (8 + pad) + '→ ' + item['fix'])
        return lines
    if kind == 'prose':
        return [line for paragraph in part['text'].split('\n') for line in wrap(paragraph, min(72, width))]
    return list(part['lines'])


def plain(view, width=80, ascii=None):
    """The view as plain text, `width` columns wide (body indented by 2)."""
    width = max(60, width); inner = width - 2
    title, summary = view.get('title'), view.get('summary', '')
    lines = []
    if title:
        head = f'── {title}'
        lines.append(head + ' ' * max(2, width - len(head) - len(summary)) + summary if summary else head + ' ' + '─' * max(3, width - len(head) - 1))
    for index, part in enumerate(view.get('parts', [])):
        if index and part.get('gap', True): lines.append('')
        if part.get('heading'): lines.append(part['heading'] if part['heading'].startswith('──') else '  ' + part['heading'])
        lines += ['  ' + line if line else '' for line in body(part, inner)]
    if view.get('hint'): lines.append('  ' + view['hint'])
    text = '\n'.join(line.rstrip() for line in lines)
    if ascii if ascii is not None else not utf8():
        for glyph, word in ASCII.items(): text = text.replace(glyph, word)
    return text
