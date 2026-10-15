# DoneRow

Under each finished answer that changed files: what was done, in plain words, for someone who does not read code. One request is one commit (task 187, G-013). Boards: P_DoneParts, P_Beside, P_Undo*, Ph_Done.

- **Placement**: a separate quiet row under Pi's message (`section.pw-done`, 1px top rule), not inside the bubble. The bubble is Pi talking; the row is the record of the change. An answer that changed nothing has no row.
- **Head** `.pw-done__head`: state glyph + word, files, time: “✓ Done · 2 files · 14:32”. **“! Not verified”** replaces Done when G-012 applies; the G-012 sentence moves here from the answer text (“Pi did not try it after the last change.”).
- **Text** `.pw-done__text`: two or three short lines Pi writes for the person (text face, 16px): what changed, then “Tried it: …”. Stored in the task file's “For the person” section so Activity and the Undo alert can quote them.
- **Actions**: **Show in Preview** (opens the Preview at the path Pi tried) · **Undo This Request…**.
- **Undo alert** (Caution): “Undo “<first plain-words line>”?” — what goes away, “Your notes are not touched” (data stays), later requests stay, nothing is lost; an open disclosure “2 files change back” lists each file with its lines (task 203's preview). **Undo Request** · **Cancel** (default).
- **Overlap** (Note alert; the built “Not undone: <file> changed again after …”): title “… can't be undone by itself.”, detail “<file> changed again after it, in “<later request>” (14:51), so going back would mix the two. Nothing was changed.”, then **Cancel** · **Ask Pi Instead** (default; sends the request in words). Never a half-applied revert.
- **Unsaved changes** (Note alert; the built “has changes that are not saved in a commit”): title “… can't be undone yet.”, detail names the file and says the changes were made in Work or another editor, “Nothing was changed.”; **Save Them, Then Undo** (commits them as “Your edits · 14:38”, then undoes) · **Cancel** (default).
- **Already undone**: never reached from the web; the row's Undo is disabled once it says “undone at”.
- **After undo**: the undo's own row “↶ Undone · 2 files · 14:40” with **Show in Preview** · **Redo Request…**; the original row's head gains “· undone at 14:40” and its Undo is disabled.
- **LessonLine** `.pw-lesson` (role="note"), at most one per answer, at the bottom of the row behind a dotted rule: book glyph + “Lesson”, one sentence from KakkoiSchool in the person's language with the lesson as a link and its length, **Hide** (text button) at the right. Settings → “Show lessons” turns them all off. No × button.
- Phone: buttons 44px; the lesson wraps, Hide stays at the right.
