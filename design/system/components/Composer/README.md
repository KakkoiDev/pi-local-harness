# Composer

The message form at the bottom of the Chat window.

- Label, textarea (`.pw-field`), then a row: Attach…, Record, the hint, Stop ⌘. (only while Pi runs), and the default button. The default button reads **Queue** while the agent is busy and **Send** when idle; both add to the one queue.
- Attachments appear above the textarea as AttachmentChips (max 8 files, 12 MiB each, 20 MiB total).
- Recording: the Record button reads Stop Recording with a filled dot; then Transcribing… in the hint; the text lands at the cursor.
- Dragging files over the composer: `.pw-composer--dragging` (3px dashed inner outline).
- Errors sit above the form in `.pw-alert-line` with the Caution glyph.
- **Recording on the phone**: the Record button keeps its 44px shape and becomes `.pw-btn--rec[aria-pressed="true"]`: inverted, a paper dot, then the elapsed time “0:12” in tabular figures; `aria-label="Stop Recording"`. One bit, not red: the inversion is the recording signal, as a pressed button is everywhere else. Board: Ph_Recording.
- **Dictate** (task 155): the same three states as Record, as an icon button beside a comment field (Review composer, thread reply, whole-file question): mic at rest (`aria-label="Dictate"`), `.pw-btn--rec[aria-pressed="true"]` with the time while recording (`aria-label="Stop dictating"`), then disabled “Transcribing…” with the hourglass; the words land at the cursor. Board: C_Dictate.

## Round 18 addendum (proposed, awaiting approval)

**Q7 · the @ list.** Proposed: typing **@** at the start of a word in a project chat opens a listbox **Projects you can open** (JA “開けるプロジェクト”) above the field. It lists the other registered projects the person can open now (never this chat's own project, never one they can't open), each with its folder. Typing filters by name. Nothing matches: “No projects match “{text}”.” (JA “「{text}」に一致するプロジェクトはありません。”). The foot reads “↑↓ to choose · Return to insert · Esc to close” (JA “↑↓ で選択 · Return で挿入 · Esc で閉じる”). Return or Tab inserts an **@-mention chip** (`span.pw-mention[contenteditable=false][data-project-id]`, “@Pong”) and a space. Boards: R18A_ProjectMention, Ph18A_ProjectMention.

- Markup: the message field becomes `div.pw-field.pw-field--rich#prompt[role=textbox][contenteditable][aria-multiline=true][aria-autocomplete=list][aria-controls=at-list][aria-expanded][aria-activedescendant]`. The listbox is `div.pw-atlist#at-list[role=listbox][aria-label="Projects you can open"]` with `div.pw-atlist__opt[role=option][aria-selected]`.
- Keyboard: ↑/↓ move the choice while focus stays in the field. Return or Tab inserts the chip; Return never sends while the list is open. Esc closes the list and leaves “@…” as plain text. Backspace right after a chip removes the whole chip. Return with the list closed sends, as today. The list doesn't open in “me@pong”.
- Phone: the list sits above the field in the composer (`.pw-atlist` turns static), with 44 px rows; tapping inserts the chip.
- A chip carries the project id, so the harness doesn't have to guess from words (see Message).
- Would supersede: the plain `textarea#prompt` (round 11) → the rich field above.
- Alternative (not recommended): only @-mentions count as explicit references. The composer is the same; see Message.
- CSS: `scripts/round18add_c.css` (`.pw-field--rich`, `.pw-mention`, `.pw-mention--gone`, `.pw-atlist*`).
