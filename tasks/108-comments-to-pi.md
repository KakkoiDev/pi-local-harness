# 108: Comments reach Pi from the Review list

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "unclear ux on how to send a comment to the ai agent, but submitting question on whole page?" Decision: Ask Pi on Review items, a Send N Unsent Comments button (Final board), and the whole-document box renamed and collapsed.

- [x] Red: unsent Review items have Ask Pi; it queues that comment and the item shows "Sent to Pi".
- [x] Red: footer button "Send N Unsent Comments to Pi" sends each unsent comment; disabled with none.
- [x] Whole-document box reads "Ask Pi about this whole file", collapsed until opened.
- Footer copy and placement from Final (Show resolved, then the full-width send button). Ask Pi on Review items goes beyond Final (the user's choice); the inline thread keeps its own Ask Pi. The whole-file box is a <details> folded by default; Project › Ask Pi About This Document… opens it. Red/green: tests/browser/design.cjs.
