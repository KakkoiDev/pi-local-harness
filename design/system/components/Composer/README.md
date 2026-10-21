# Composer

The message form at the bottom of the Chat window.

- Label, textarea (`.pw-field`), then a row: Attach…, Record, the hint, Stop ⌘. (only while Pi runs), and the default button. The default button reads **Queue** while the agent is busy and **Send** when idle; both add to the one queue.
- Attachments appear above the textarea as AttachmentChips (max 8 files, 12 MiB each, 20 MiB total).
- Recording: the Record button reads Stop Recording with a filled dot; then Transcribing… in the hint; the text lands at the cursor.
- Dragging files over the composer: `.pw-composer--dragging` (3px dashed inner outline).
- Errors sit above the form in `.pw-alert-line` with the Caution glyph.
- **Recording on the phone**: the Record button keeps its 44px shape and becomes `.pw-btn--rec[aria-pressed="true"]`: inverted, a paper dot, then the elapsed time “0:12” in tabular figures; `aria-label="Stop Recording"`. One bit, not red: the inversion is the recording signal, as a pressed button is everywhere else. Board: Ph_Recording.
- **Dictate** (task 155): the same three states as Record, as an icon button beside a comment field (Review composer, thread reply, whole-file question): mic at rest (`aria-label="Dictate"`), `.pw-btn--rec[aria-pressed="true"]` with the time while recording (`aria-label="Stop dictating"`), then disabled “Transcribing…” with the hourglass; the words land at the cursor. Board: C_Dictate.

## Round 18 addendum (settled or superseded in round 19 — see Round 19)

Revised 21 Oct after review.

**Q7 · the @ list (project chat composer only).** Proposed: typing **@** at the start of a word in the project chat composer opens a listbox **Projects you can open** (JA “開けるプロジェクト”).

- **Placement:** the list is anchored to the caret. Its left edge sits at the @, above the line, or below it when there is no room above. On the phone it sits full width above the field with 44 px rows.
- **Contents:** the other registered projects the person can open now, each with its folder. Never this chat's own project, never one they can't open.
- **Filtering:** typing filters by name. Nothing matches: “No projects match “{text}”.” (JA “「{text}」に一致するプロジェクトはありません。”).
- **Foot:** “↑↓ to choose · Return to insert · Esc to close” (JA “↑↓ で選択 · Return で挿入 · Esc で閉じる”).
- **Chip:** Return or Tab inserts an @-mention chip (`span.pw-mention[contenteditable=false][data-project-id]`, “@Pong”) and a space.
- **Not covered:** comment composers (Review window, threads, whole-file questions) are deferred and don't offer @.
- **Markup:** `div.pw-field.pw-field--rich#prompt[role=textbox][contenteditable][aria-multiline=true][aria-autocomplete=list][aria-controls=at-list][aria-expanded][aria-activedescendant]`, and `div.pw-atlist#at-list[role=listbox]` positioned at the caret, with `div.pw-atlist__opt[role=option][aria-selected]`.
- **Keyboard:** ↑/↓ move the choice while focus stays in the field. Return or Tab inserts the chip; Return never sends while the list is open. Esc closes the list and leaves “@…” as plain text. Backspace right after a chip removes it whole. Return with the list closed sends, as today. “me@pong” never opens the list.
- **Would supersede:** the plain `textarea#prompt` (round 11) in the project chat → the rich field.
- **Alternative (not recommended):** only @-mentions count (see Message).
- **CSS:** `scripts/round18add_c.css` (`.pw-field--rich`, `.pw-mention`, `.pw-mention--gone`, `.pw-atlist*`). It uses the existing `.pw-caret` as is.
- **Boards:** R18A_ProjectMention, Ph18A_ProjectMention.

## Round 19 (decided, owner-delegated 21 Oct 2026)

Design only; not implemented. Brief: design/briefs/round-19-final-integration.md, A7 and A8. Boards: R19_ProjectMention, Ph19_ProjectMention, R19_ProjectChatResend, R19_ProjectChatStrings, R19_ProjectChatWalk. CSS: `scripts/round19_c.css` (new classes only).

**A7 · explicit project references in the project chat composer.** The addendum's rule is settled:

- An @ chip counts, or the exact registered name with the word project (“the Notes project”, “Notes project”, “project Notes”; JA Notes プロジェクト, プロジェクト Notes, 「Notes」プロジェクト).
- Quotes alone never count.
- Recognition is a deterministic host rule (System 1), not a model judgement.
- A mention never grants permission and never adds a project to what Pi searches.

**The @ list and its states.** The @ list is anchored to the caret. Comment composers are deferred.

| State | Behaviour |
| --- | --- |
| Idle | List closed. |
| Open | “Projects you can open”: the other registered projects the person can open now, with folders. |
| Loading | Not applicable: the list comes from the authorized project list already held by the page, so there is nothing to fetch. |
| Empty | “No projects match “{text}”.” An unauthorized project (Tetris) gives the same message as any word. |
| Error | The project list can't be read: the list doesn't open, and @ stays plain text. |
| Disabled | During IME composition, the list stays closed. On commit it opens, filtered by the committed text. |
| Stale | A project lost while the list is open is removed from it, and the choice moves to the next row. |
| Conflict | Two authorized projects share a name: “Which {Notes}?” (JA “どの {Notes} ですか？”) opens at the phrase “the Notes project”, with “Choose one to refer to it. Esc keeps your words; they won’t count as a project.” Choosing inserts the chip “@Notes · ~/school/Notes”. Ambiguous text never widens anything and never adds the notice. |

- **Layout:** with wrapped lines the list anchors to the caret's line. With more than six projects the list scrolls (its name includes the count, “Projects you can open · 8”). Long names truncate before folders. At 320 px the list takes the field's width.
- **Keyboard:** ↑/↓ and Page Up/Down move the choice; Return or Tab insert, never send; Escape closes and keeps the typed words. If the caret scrolls out of view the list closes. Backspace removes a whole chip.
- **Touch:** with the touch keyboard up, the list sits above the field, full width, with 44 px rows.
- **Who:** the signed-in person, in a project they can open. **Persistence:** none, beyond the draft (B's DraftVersions). **Focus:** stays in the field throughout.

**A8 · submission recheck.** Send rechecks the phase, scope and authorization. If the phase changed (for example another window moved the project to Implementation while a plan waits), nothing is sent: “Not sent: the project is now in Implementation and a plan is waiting. Your message is still in the composer.” Without a waiting plan: “Not sent: the project is now in Planning. Your message is still in the composer; press Send to send it in Planning.” A failed send reads “Not sent: the connection was interrupted. Your message is still in the composer.” with **Try Again** (it resends the same text once). The text is never lost or sent silently. Each line is a `.pw-alert-line[role=alert]` above the field, and focus stays in the field.

**A3 · drafts in project chat.** Drafts use B's **DraftVersions** above the composer, unchanged.

Inverse: tokens only (dark cells on R19_ProjectMention).

### Follow-up decisions (21 Oct)

Decision record: design/briefs/round-19-follow-up-decisions.md. Design only. Boards: R19_ProjectChatUnsaved, Ph19_ProjectChatDeleted, R19_ProjectChatWalk.

- **1 · Unsaved.** When the project chat composer's text can't reach the host, its version in B's **DraftVersions** reads **Unsaved** (JA 未保存). A help line sits under the composer: “Unsaved text stays in this window. If the browser or phone closes the page, it can be lost.” (JA “未保存の文字はこのウインドウに残ります。ブラウザーや電話がページを閉じると失われることがあります。”). It is `p.pw-draftv__help`, referenced by the field's `aria-describedby`.
  - **Leaving the page:** while Unsaved text exists, the browser's native leave-page warning is registered. There is no Pi copy, and it is best effort: a crash, a killed tab or a phone evicting the page can still lose the text.
  - **In-app navigation** (Work ⌃⌥2, ‹ Projects, another project, an Overview row) keeps the text in memory for this window, and a failed navigation never clears it.
  - **Storage:** never in browser storage.
- **2 · Saving.** “Saving…” means one save is in flight; typing continues and no second save starts. An acknowledgement for an older revision never marks newer text Saved. An online failure shows **Not saved** + **Retry** (JA 保存されていません / 再試行). Retry is revision-checked: a newer save elsewhere becomes a Conflict version, and nothing is overwritten.
- **3 · Deleted in another window.** Editing and sending stop. The chat body is replaced by B's read-only Trash detail with the notice “This conversation was moved to the Trash in another window.” and, if there was unsaved text, “Your unsaved text is kept as a draft version with it.” The toolbar title and ⋯ are hidden while the conversation is in the Trash. Late or retried saves are never sent. **Restore** rechecks access and resumes nothing.
- **States:**

| State | What shows |
| --- | --- |
| Idle | Saved (no help line) |
| Loading | Saving… |
| Empty | Not applicable: no text means no version to save |
| Error | Not saved + Retry |
| Disabled | Composer gone while the conversation is in the Trash |
| Stale | An old acknowledgement after newer typing stays Saving… |
| Conflict | Version rows as B's DraftVersions |

- **Who:** the signed-in person, in their conversation. **Persistence:** the host only. **Cancellation:** nothing to cancel; a save is never cancelled by navigation. **Focus:** stays in the field; on remote deletion it moves to the Trash detail's heading, with one polite announcement.
- **15 · Comment composers:** @ mentions stay deferred in comment composers (Review window, threads, whole-file questions). This release offers the @ list only in the project chat composer.
