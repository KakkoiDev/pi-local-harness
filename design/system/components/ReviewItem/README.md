# ReviewItem

A comment in the Review window (desktop) or the Comments sheet (phone), in document order, under the Open · Resolved · Deleted filter.

- Head (`.pw-review-item__head`, a button that opens the thread in the text): number · state line, and the time.
- The quoted passage in italics, then the comment.
- Actions by state: Open → Resolve (and Delete if unsent); Resolved → Reopen; Deleted → Restore. Deleted comments are kept for good.
- The current item has `aria-current="true"` (2px inner outline).
