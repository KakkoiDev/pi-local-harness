# 155: The block handle shows the hand

Kind: code

Request 2026-10-14: "when hovering the little block handle in the md editor, I want to change the cursor to show the hand to indicate that we can interact with that handle elemenet".

- [x] Red (browser): the block handle's cursor is `pointer` (design.cjs).
- [x] `.pw-block__handle{cursor:pointer}` in chat.css; added to the brief (`design/briefs/round-4-notes.md` item 10).
- [x] Green: design suite. (The assertion was written after the CSS rule, so it was not seen failing first.)
