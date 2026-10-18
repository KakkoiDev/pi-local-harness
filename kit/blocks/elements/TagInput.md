# TagInput

App Block card (Other elements). Type free words and turn each into a removable tag, with suggestions from tags already used.

- Basecoat: `field`, `label`, `badge` (`data-variant="secondary"`), `btn` (remove), `popover` list for suggestions
- Needs: A small script (below, ~40 lines) or htmx; suggestions from `GET /tags?q=` or the store
- Used in: EditForm, DocEditor (page tags), Gallery, AppNotes, AppForum

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/TagInput.html` (20 lines of HTML).

Each tag is a `li.badge` with its own hidden input `name="tags"`, so the form posts `tags=kanji&tags=n5` with no script. The script only adds and removes `li`s.

Copy, never retype: `{harness}/kit/blocks/elements/TagInput.js` (22 lines of JS).

## States
- Empty: No `li`; only the input with `tags.placeholder`.
- Typing with suggestions: `#tags-suggest` shows `role="option"` rows of existing tags that start with the text (max 6), first one highlighted; `aria-expanded="true"`.
- Duplicate: The existing badge flashes once (`animate-pulse` for 600 ms); nothing is added; the help line says `tags.duplicate` (`aria-live="polite"` on the help).
- At the limit: The input gets `disabled` and the placeholder `tags.limit` (“10 tags is the most”).
- Too long: Cut at 30 characters while typing (`maxlength="30"` on the input).
- Invalid characters: Only letters, numbers, spaces, `-` and `_`; others are dropped silently on add.
- Disabled: Badges stay, remove buttons and input `disabled`.
- Added or removed: A `<p id="tags-live" class="sr-only" aria-live="polite"></p>` after the field says `tags.added` (“Added kanji”) or `tags.removed` (“Removed kanji”), set from code.

## Texts
(Key | English | 日本語)
- `tags.label`: Tags | タグ
- `tags.chosen`: Chosen tags | 選択したタグ
- `tags.placeholder`: Add a tag | タグを追加
- `tags.help`: Press Return or comma after each tag. | タグごとに Return キーか読点（、）を押してください。
- `tags.remove`: Remove {tag} | {tag}を削除
- `tags.suggestions`: Suggestions | 候補
- `tags.duplicate`: “{tag}” is already added. | 「{tag}」はすでに追加されています。
- `tags.limit`: 10 tags is the most | タグは10個までです
- `tags.added`: Added {tag} | {tag}を追加しました
- `tags.removed`: Removed {tag} | {tag}を削除しました

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> TagInput` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
