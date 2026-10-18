# TagInput

Type free words and turn each into a removable tag, with suggestions from tags already used.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `field`, `label`, `badge` (`data-variant="secondary"`), `btn` (remove), `popover` list for suggestions |
| Needs | A small script (below, ~40 lines) or htmx; suggestions from `GET /tags?q=` or the store |
| Used in | EditForm, DocEditor (page tags), Gallery, AppNotes, AppForum |

For choosing from a fixed list (labels with colours, people) use ComboboxField with several values. TagInput is for words the person makes up.

## Markup

```html
<div class="field">
  <label class="label" for="tags-input" data-t="tags.label">Tags</label>
  <div id="tags" class="flex flex-wrap items-center gap-1.5 rounded-md border border-input p-1.5 focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring dark:bg-input/30">
    <ul class="contents" id="tags-list" aria-label="Chosen tags" data-t-label="tags.chosen">
      <li class="badge" data-variant="secondary">
        <span>kanji</span>
        <button type="button" class="-me-1 rounded-full p-0.5 hover:bg-foreground/10" tabindex="-1" aria-label="Remove kanji" data-t-label="tags.remove" data-tag="kanji">
          <svg class="size-3" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <input type="hidden" name="tags" value="kanji">
      </li>
    </ul>
    <input id="tags-input" class="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none" type="text"
           role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="tags-suggest"
           aria-describedby="tags-help" placeholder="Add a tag" data-t-placeholder="tags.placeholder" autocomplete="off" enterkeyhint="done">
  </div>
  <template id="tags-template"><li class="badge" data-variant="secondary"><span></span><button type="button" class="-me-1 rounded-full p-0.5 hover:bg-foreground/10" tabindex="-1" aria-label="Remove" data-t-label="tags.remove"><svg class="size-3" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button><input type="hidden" name="tags"></li></template>
  <div id="tags-suggest" role="listbox" class="hidden" aria-label="Suggestions" data-t-label="tags.suggestions"></div>
  <p class="text-muted-foreground text-sm" id="tags-help" data-t="tags.help">Press Return or comma after each tag.</p>
</div>
```

Each tag is a `li.badge` with its own hidden input `name="tags"`, so the form posts `tags=kanji&tags=n5` with no script. The script only adds and removes `li`s.

```js
// js/tag-input.mjs
export function tagInput(root, {max = 10, maxLength = 30} = {}) {
  const input = root.querySelector('input[role="combobox"]');
  const list = root.querySelector('ul');
  const have = () => [...list.querySelectorAll('input[name="tags"]')].map(i => i.value);
  function add(raw) {
    const tag = raw.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, maxLength);
    if (!tag || have().includes(tag) || have().length >= max) return false;
    const li = root.parentElement.querySelector('template').content.firstElementChild.cloneNode(true);
    li.querySelector('span').textContent = tag;
    li.querySelector('button').dataset.tag = tag;
    li.querySelector('button').setAttribute('aria-label', `${t('tags.remove').replace('{tag}', tag)}`); // t(): the app's translate
    li.querySelector('input').value = tag;
    list.append(li); return true;
  }
  input.addEventListener('keydown', e => {
    if (e.isComposing) return;                        // Japanese IME: wait for the composition to end
    if (e.key === 'Enter' || e.key === ',' || e.key === '、') { e.preventDefault(); if (add(input.value)) input.value = ''; }
    if (e.key === 'Backspace' && !input.value) list.lastElementChild?.remove();
  });
  list.addEventListener('click', e => { const b = e.target.closest('button[data-tag]'); if (b) { b.closest('li').remove(); input.focus(); } });
}
```

## States

| State | What changes |
| --- | --- |
| Empty | No `li`; only the input with `tags.placeholder`. |
| Typing with suggestions | `#tags-suggest` shows `role="option"` rows of existing tags that start with the text (max 6), first one highlighted; `aria-expanded="true"`. |
| Duplicate | The existing badge flashes once (`animate-pulse` for 600 ms); nothing is added; the help line says `tags.duplicate` (`aria-live="polite"` on the help). |
| At the limit | The input gets `disabled` and the placeholder `tags.limit` (“10 tags is the most”). |
| Too long | Cut at 30 characters while typing (`maxlength="30"` on the input). |
| Invalid characters | Only letters, numbers, spaces, `-` and `_`; others are dropped silently on add. |
| Disabled | Badges stay, remove buttons and input `disabled`. |
| Added or removed | A `<p id="tags-live" class="sr-only" aria-live="polite"></p>` after the field says `tags.added` (“Added kanji”) or `tags.removed` (“Removed kanji”), set from code. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `tags.label` | Tags | タグ |
| `tags.chosen` | Chosen tags | 選択したタグ |
| `tags.placeholder` | Add a tag | タグを追加 |
| `tags.help` | Press Return or comma after each tag. | タグごとに Return キーか読点（、）を押してください。 |
| `tags.remove` | Remove {tag} | {tag}を削除 |
| `tags.suggestions` | Suggestions | 候補 |
| `tags.duplicate` | “{tag}” is already added. | 「{tag}」はすでに追加されています。 |
| `tags.limit` | 10 tags is the most | タグは10個までです |
| `tags.added` | Added {tag} | {tag}を追加しました |
| `tags.removed` | Removed {tag} | {tag}を削除しました |

## Keyboard and focus

1. The tag input → 2. the next field. Remove buttons are `tabindex="-1"` so Tab stays short; ← at the start of the input moves onto the last tag (← → between tags, Delete or Backspace removes it, → past the last tag or Return goes back to the input).
- Return, comma or 、 adds; Backspace on an empty input removes the last tag; ↓ moves into suggestions, Return chooses one, Esc closes them.
- After each add or remove, announce `tags.added` / `tags.removed` in a `sr-only` `aria-live="polite"` region.

## Phone

- The input stays at least 6rem wide and wraps under the tags. `enterkeyhint="done"` shows Done on the keyboard; tapping a badge's × removes it (the × button grows to 44 px with `@max-3xl:min-h-11 @max-3xl:min-w-11`).
- Suggestions show as a list under the field (not a floating popover), pushing content down.

## Data

```json
{"tags": ["kanji", "n5", "verbs"], "max": 10, "suggestions": ["kana", "kanji", "katakana"]}
```

- Web: the form posts repeated `tags`; suggestions: `hx-get="/tags?q=" hx-trigger="input changed delay:200ms" hx-target="#tags-suggest"`. The server normalizes (trim, lowercase, dedupe) again.
- No server: tags live on the record (`note.tags`); suggestions from all records' tags, sorted by use.

## Don't

- Don't split on spaces: tags may have spaces (“past tense”).
- Don't add on IME Return while composing Japanese.
- Don't colour free tags; colours belong to LabelsAssignees.
