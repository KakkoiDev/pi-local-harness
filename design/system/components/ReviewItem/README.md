# ReviewItem

A comment in the Review window (desktop) or the Comments sheet (phone), in document order, under the Open · Resolved · Deleted filter.

- Head (`.pw-review-item__head`, a button that opens the thread in the text): number · state line, and the time.
- The quoted passage in italics, then the comment.
- Actions by state: Open and unsent → **Ask Pi**, Resolve, Delete; Open and sent → Resolve and a “Show in Activity” link (the old “Open Chat” link is gone: answers never reach Chat); Resolved → Reopen; Deleted → Restore. Deleted comments are kept for good.
- The head's state line uses the thread's words: Not sent to Pi · Sent to Pi · waiting in queue · Pi is working on it · Pi answered · Pi suggested a change.
- Review window around the items: the comment composer at the top when a passage is selected (quote, Comment field, ContextLine, Clear Selection, **Add Comment**); the footer “Show resolved in the text” + **Send N Unsent Comments to Pi** (disabled “No unsent comments”); then **Ask Pi about this whole file** folded in a `<details>` at the bottom (field, ContextLine, Send Request, “The answer appears here, not in Chat.”, recent answers with Also read). Empty lists use `.pw-empty`: “No open comments.”, “Nothing resolved yet.”, “No deleted comments.”
- The current item has `aria-current="true"` (2px inner outline).
