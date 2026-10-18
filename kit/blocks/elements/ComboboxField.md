# ComboboxField

App Block card (Other elements). Choose from a list too long or too rich for a native select: a rich select (a button that opens a list) or a combobox (type to filter), one value or several.

- Basecoat: `select` (the macro, `div.select`), `combobox`, `field`, `label`, `popover` (inside both), `input-group` (clear button)
- Needs: `js/basecoat.min.js` (select and combobox register themselves). Long or server lists: `GET /options?q=`
- Used in: EditForm, LabelsAssignees, Checkout (prefecture), Invite (role), IssueList (filters)
- Case: Use
- Up to ~12 short options, one value: native `<select class="select">` (see EditForm)
- Up to ~50 options that need an icon, a second line or groups: **rich select** (`div.select`)
- Many options, people know what they want (countries, people, tags): **combobox** (type to filter)
- Several values: combobox with `aria-multiselectable` (macro `multiple=true`); chips are drawn by Basecoat's script

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/ComboboxField.html` (42 lines of HTML).

Attribute texts: `data-t-placeholder="key"` fills `placeholder`, `data-t-label="key"` fills `aria-label`, `data-t-empty="key"` fills `data-empty` (the empty-list message Basecoat shows). Keep the English text in the attribute itself.

## States
- Closed, nothing chosen: Rich select trigger shows `combo.choose` in `text-muted-foreground`; hidden input empty.
- Open: Trigger or input `aria-expanded="true"`, popover `aria-hidden="false"`, the highlighted option gets `aria-selected`-independent `data-highlighted` / `aria-activedescendant` (Basecoat's script).
- Filtering: Non-matching options get `aria-hidden="true"`; a group with no visible options hides itself (CSS).
- No match: The listbox shows its `data-empty` text. If people may add their own value, add a last option `role="option" data-value="__new"` with `combo.add` (“Add “{text}””).
- Loading (server list): Replace options with one `<div role="option" aria-disabled="true" data-t="combo.loading">Loading…</div>`; debounce 250 ms.
- Error loading: One disabled option with `combo.error` and keep what was typed.
- Several chosen: Basecoat draws `.combobox-chips` with a `.combobox-chip` per value and a `.combobox-chip-remove` button; the hidden input holds a JSON array.
- Invalid: `aria-invalid="true"` on the trigger/input + error line under the field (`combo.error.required`).
- Disabled: `disabled` on the trigger/input.

## Texts
(Key | English | 日本語)
- `combo.assignee`: Assignee | 担当者
- `combo.team`: Team | チーム
- `combo.nobody`: No one | 担当者なし
- `combo.choose`: Choose… | 選択…
- `combo.country`: Country or region | 国または地域
- `combo.country_ph`: Search countries | 国を検索
- `combo.no_match`: No country matches. | 該当する国がありません。
- `combo.add`: Add “{text}” | 「{text}」を追加
- `combo.loading`: Loading… | 読み込み中…
- `combo.error`: Couldn’t load the list. Type again to retry. | リストを読み込めませんでした。もう一度入力すると再試行します。
- `combo.error.required`: Choose one. | 1つ選んでください。
- `combo.remove`: Remove {name} | {name}を削除

## Keyboard and focus
1. The trigger or the input → 2. the next field (the list is not in the Tab order).
- Rich select: Return, Space or ↓ opens on the chosen option; ↑ ↓ move, Home / End first / last, typing a letter jumps, Return chooses and closes, Esc closes without change; focus stays on the trigger.
- Combobox: typing opens and filters; ↓ moves into the list, Return chooses, Esc first closes then clears. In several-values mode Backspace on an empty input removes the last chip.
- IME (Japanese): don't filter or choose while composing (`event.isComposing`); Return that ends composition must not choose.

## Phone
- Options are 44 px tall (App foundations). The popover takes the full field width and at most 60% of the screen height, scrolling inside.
- For more than ~50 options on the phone, open the list as a full-height sheet (`<dialog class="dialog">` with the same listbox) instead of a popover.

## Data
```json
{"options": [{"value": "u1", "label": "Aiko Tanaka", "group": "Team", "initials": "AT"}, {"value": "u2", "label": "Kenji Sato", "group": "Team"}],
 "selected": "u1", "multiple": false}
```

- Web: render the options in the macro; for long lists `hx-get="/options?q={text}" hx-trigger="input changed delay:250ms" hx-target="#country-listbox"` returning only `role="option"` divs. The form posts the hidden input (`assignee=u1`; several: `labels=["bug","ui"]`).
- No server: options from the store; Basecoat's script filters by the option text, so put both languages' names in it when people may type either (“Japan · 日本”).

## Don't
- Don't rebuild a select with `div`s and your own script: use the macro markup and Basecoat's script.
- Don't put buttons or links inside options.
- Don't use a combobox for fewer than ~8 options.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ComboboxField` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
