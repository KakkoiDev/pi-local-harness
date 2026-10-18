# ComboboxField

Choose from a list too long or too rich for a native select: a rich select (a button that opens a list) or a combobox (type to filter), one value or several.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `select` (the macro, `div.select`), `combobox`, `field`, `label`, `popover` (inside both), `input-group` (clear button) |
| Needs | `js/basecoat.min.js` (select and combobox register themselves). Long or server lists: `GET /options?q=` |
| Used in | EditForm, LabelsAssignees, Checkout (prefecture), Invite (role), IssueList (filters) |

Which one:

| Case | Use |
| --- | --- |
| Up to ~12 short options, one value | native `<select class="select">` (see EditForm) |
| Up to ~50 options that need an icon, a second line or groups | **rich select** (`div.select`) |
| Many options, people know what they want (countries, people, tags) | **combobox** (type to filter) |
| Several values | combobox with `aria-multiselectable` (macro `multiple=true`); chips are drawn by Basecoat's script |

In Jinja use the macros: `{% import 'basecoat/select.html.jinja' as s %}{{ s.select(id='assignee', name='assignee', items=[…]) }}` and `{% import 'basecoat/combobox.html.jinja' as c %}{% call c.combobox(id='country', name='country', placeholder=t('combo.country_ph')) %}…options…{% endcall %}`. The markup below is what they write.

## Markup

```html
<!-- Rich select -->
<div class="field">
  <label class="label" id="assignee-label" for="assignee-trigger" data-t="combo.assignee">Assignee</label>
  <div id="assignee" class="select">
    <button type="button" id="assignee-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="assignee-listbox" aria-labelledby="assignee-label assignee-trigger">
      <span class="truncate">Aiko Tanaka</span>
      <svg class="text-muted-foreground opacity-50 shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div id="assignee-popover" data-popover aria-hidden="true">
      <div role="listbox" id="assignee-listbox" aria-orientation="vertical" aria-labelledby="assignee-trigger">
        <div role="group" aria-labelledby="assignee-g1">
          <div role="heading" id="assignee-g1" data-t="combo.team">Team</div>
          <div id="assignee-1" role="option" data-value="u1" aria-selected="true">
            <span class="avatar" data-size="sm"><span>AT</span></span> Aiko Tanaka
          </div>
          <div id="assignee-2" role="option" data-value="u2"><span class="avatar" data-size="sm"><span>KS</span></span> Kenji Sato</div>
        </div>
        <hr role="separator">
        <div id="assignee-3" role="option" data-value="" data-t="combo.nobody">No one</div>
      </div>
    </div>
    <input type="hidden" name="assignee" value="u1">
  </div>
</div>

<!-- Combobox: type to filter -->
<div class="field">
  <label class="label" for="country-input" data-t="combo.country">Country or region</label>
  <div id="country" class="combobox">
    <input type="text" id="country-input" role="combobox" placeholder="Search countries" data-t-placeholder="combo.country_ph"
           autocomplete="off" autocorrect="off" spellcheck="false" aria-autocomplete="list" aria-expanded="false" aria-controls="country-listbox">
    <svg class="combobox-trigger-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
    <div id="country-popover" data-popover aria-hidden="true">
      <div role="listbox" id="country-listbox" aria-orientation="vertical" data-empty="No country matches." data-t-empty="combo.no_match">
        <div id="country-1" role="option" data-value="JP">Japan · 日本</div>
        <div id="country-2" role="option" data-value="KR">South Korea · 대한민국</div>
        <div id="country-3" role="option" data-value="TW">Taiwan · 台灣</div>
      </div>
    </div>
    <input type="hidden" name="country" value="">
  </div>
</div>
```

Attribute texts: `data-t-placeholder="key"` fills `placeholder`, `data-t-label="key"` fills `aria-label`, `data-t-empty="key"` fills `data-empty` (the empty-list message Basecoat shows). Keep the English text in the attribute itself.

## States

| State | What changes |
| --- | --- |
| Closed, nothing chosen | Rich select trigger shows `combo.choose` in `text-muted-foreground`; hidden input empty. |
| Open | Trigger or input `aria-expanded="true"`, popover `aria-hidden="false"`, the highlighted option gets `aria-selected`-independent `data-highlighted` / `aria-activedescendant` (Basecoat's script). |
| Filtering | Non-matching options get `aria-hidden="true"`; a group with no visible options hides itself (CSS). |
| No match | The listbox shows its `data-empty` text. If people may add their own value, add a last option `role="option" data-value="__new"` with `combo.add` (“Add “{text}””). |
| Loading (server list) | Replace options with one `<div role="option" aria-disabled="true" data-t="combo.loading">Loading…</div>`; debounce 250 ms. |
| Error loading | One disabled option with `combo.error` and keep what was typed. |
| Several chosen | Basecoat draws `.combobox-chips` with a `.combobox-chip` per value and a `.combobox-chip-remove` button; the hidden input holds a JSON array. |
| Invalid | `aria-invalid="true"` on the trigger/input + error line under the field (`combo.error.required`). |
| Disabled | `disabled` on the trigger/input. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `combo.assignee` | Assignee | 担当者 |
| `combo.team` | Team | チーム |
| `combo.nobody` | No one | 担当者なし |
| `combo.choose` | Choose… | 選択… |
| `combo.country` | Country or region | 国または地域 |
| `combo.country_ph` | Search countries | 国を検索 |
| `combo.no_match` | No country matches. | 該当する国がありません。 |
| `combo.add` | Add “{text}” | 「{text}」を追加 |
| `combo.loading` | Loading… | 読み込み中… |
| `combo.error` | Couldn’t load the list. Type again to retry. | リストを読み込めませんでした。もう一度入力すると再試行します。 |
| `combo.error.required` | Choose one. | 1つ選んでください。 |
| `combo.remove` | Remove {name} | {name}を削除 |

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
