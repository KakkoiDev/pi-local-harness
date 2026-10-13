# 121: Enter that confirms Japanese input never sends

Kind: code

Request 2026-10-13: "when typing with the japanese keyboard, pressing enter to select a kanji also sends the message." Cause: Safari fires the confirming Enter keydown after compositionend, with `isComposing` false and `keyCode` 229; the composer (js/chat.mjs) and block Return (js/workspace.mjs) only check `isComposing`.

- [x] Red (tests/browser/design.cjs): a Safari-style confirming Enter (keyCode 229, isComposing false) in the composer sends nothing and in a block adds no block; a plain Enter still sends.
- [x] `imeEnter(event)` in js/ui.mjs, used by both.
- Also: a capture-phase guard cancels a confirming Enter in any one-line input (comment reply, dialog names), so it cannot submit the form; tested by checking the event is cancelled (a script-made Enter never submits), red with the guard removed.
- Not verified with a real Japanese IME in Safari (Chromium only here, with Safari's event shape); please confirm on your Mac and iPhone.
- chat.cjs failed once at the attachment step (reply 4 not seen in 30s) and passed on rerun: a timing flake, noted.
