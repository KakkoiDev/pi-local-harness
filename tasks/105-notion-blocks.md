# 105: Blocks are added from the handle and the page end

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "like on notion where we click on the little handle next to a block and that's where we see the create block option. and then we update what the block is by selecting it again. also should be able to create new block by clicking at the end of the page." New design decision: the handoff never specified adding blocks (task 98).

- [x] Red (browser): handle menu has Add Block Below; it inserts an empty Text block after and focuses it.
- [x] Red: clicking the empty area below the last block adds a Text block (or focuses an existing empty last one).
- [x] Menu labels name the block type ("Delete Checkbox", "Comment on Heading").
- [x] Handle menu opened from keyboard sits beside the handle, not at the window corner.
- [x] design/IMPLEMENTATION.md editing section records the decision.
- User additions while building: the handle vanished on the way to it (hover zone now covers the gutter, red step test in design.cjs) and "are those blocks paragraphs or blocks?" (blocks; Paragraph is one type; menu labels name the type). Return/Backspace block keys and Delete with Undo added (DESIGN forgiveness rule; PhoneEdit7). Red/green: tests/browser/design.cjs; chat.cjs unchanged except order kept (Turn Into first).
