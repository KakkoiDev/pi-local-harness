import { loadTerminalLanguage, tr } from '../../harness/language.mjs';
// Terminal Pi in Japanese (the person, 2026-10-15): only the screens and texts; /commands stay in English. Japanese
// characters take two terminal columns, so tables and wrapping count columns, not characters.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { columns, renderView } from '../../harness/terminal-render.mjs';
import { terminalLanguage, translateView } from '../../harness/language.mjs';
import { translator } from '../../js/i18n.mjs';

test('Japanese takes two columns; tables line up and Japanese wraps without spaces', () => {
  assert.equal(columns('日本語'), 6); assert.equal(columns('abc'), 3); assert.equal(columns('実行中 · 3'), 10);
  const lines = renderView({ title: '状態', parts: [{ kind: 'table', columns: ['状態', 'ID'], rows: [['実行中', 'a1'], ['done', 'b2']] }] }, 60);
  const ids = lines.filter(line => /a1|b2|ID/.test(line)).map(line => columns(line.slice(0, line.search(/a1|b2|ID/))));
  assert.equal(new Set(ids).size, 1, 'the ID column starts at the same column on every row: ' + JSON.stringify(lines));
  const prose = renderView({ parts: [{ kind: 'prose', text: 'これは長い日本語の文章です。'.repeat(8) }] }, 60);
  assert.ok(prose.length > 1 && prose.every(line => columns(line) <= 60), JSON.stringify(prose));
});

test('the language: the setting, else the terminal\'s locale, else English', () => {
  assert.equal(terminalLanguage('ja', {}), 'ja');
  assert.equal(terminalLanguage('system', { LANG: 'ja_JP.UTF-8' }), 'ja');
  assert.equal(terminalLanguage('en', { LANG: 'ja_JP.UTF-8' }), 'en');
  assert.equal(terminalLanguage(undefined, {}), 'en');
});

test('a view: titles, labels, headers, states and prose are translated; values and /commands are not', () => {
  const translate = translator({ exact: { Status: '状態', Model: 'モデル', State: '状態', running: '実行中', 'Nothing is stuck.': '止まっているものはありません。' },
    patterns: [['Type {command} to change it.', '{command} で変更できます。']] });
  const view = translateView({ title: 'Status', hint: 'Type /config set effort high to change it.', parts: [
    { kind: 'kv', rows: [['Model', 'gemma4:26b-mlx']] },
    { kind: 'table', columns: ['State', 'Project'], rows: [['running', 'Status']] },
    { kind: 'prose', text: 'Nothing is stuck.' },
    { kind: 'checklist', items: [{ state: 'fix', label: 'Model', detail: 'gemma4 is missing', fix: '/models pull gemma4' }] },
  ] }, translate);
  assert.equal(view.title, '状態'); assert.equal(view.hint, '/config set effort high で変更できます。');
  assert.deepEqual(view.parts[0].rows, [['モデル', 'gemma4:26b-mlx']], 'the value stays');
  assert.deepEqual(view.parts[1].columns, ['状態', 'Project'].map(text => translate(text) ?? text));
  assert.deepEqual(view.parts[1].rows, [['実行中', 'Status']], 'a project named Status stays: only the state column is translated');
  assert.equal(view.parts[2].text, '止まっているものはありません。');
  assert.equal(view.parts[3].items[0].fix, '/models pull gemma4', 'a /command is never translated');
});

test('the terminal translates what the agent found left out: dim tool rows, startup, marked states, errors', async () => {
  const { loadTerminalLanguage, translateView } = await import('../../harness/language.mjs');
  const { checkLines } = await import('../../harness/tool-render.mjs');
  const { renderStartup, startupLines } = await import('../../harness/startup-display.mjs');
  loadTerminalLanguage('ja');
  try {
    const blocked = checkLines('bash', { gate: 'blocked', reason: 'x' }).join('\n');
    assert.ok(!blocked.includes('Nothing ran.'), blocked);
    const lines = startupLines({ web: 1, gate: 2, remote: 'https://mac.tail.ts.net:8443' });
    const drawn = renderStartup(lines, 80).join('\n');
    assert.ok(drawn.includes('█') || drawn.includes('▀'), 'the QR code still shows in Japanese');
    assert.ok(!drawn.includes('Ask in words'), drawn);
    const view = translateView({ title: 'x', parts: [{ kind: 'table', columns: ['NAME', 'STATE'], rows: [['my thing', '▶ Running']] },
      { kind: 'kv', rows: [['Web', '✓ Running'], ['Folder', '/Users/a/Running']] }, { kind: 'lines', lines: ['○ Not changed.'] }] });
    assert.notEqual(view.parts[0].rows[0][1], '▶ Running');
    assert.equal(view.parts[0].rows[0][0], 'my thing');
    assert.notEqual(view.parts[1].rows[0][1], '✓ Running');
    assert.equal(view.parts[1].rows[1][1], '/Users/a/Running');
    assert.notEqual(view.parts[2].lines[0], '○ Not changed.');
  } finally { loadTerminalLanguage('en'); }
});

test('automatic run counts and risks are translated in Japanese',()=>{
 loadTerminalLanguage('ja');
 try {assert.equal(tr('Run report: 2 tasks · 1 decisions · 0 external actions · 3 problems. /report'),'実行レポート：タスク 2件・決定 1件・外部への操作 0件・問題 3件。/report');assert.equal(tr('Turn On'),'オンにする');}
 finally {loadTerminalLanguage('en');}
});
