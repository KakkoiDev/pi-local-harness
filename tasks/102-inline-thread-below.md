# 102: Inline comment thread opens below its passage

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "the comments open on the side instead of under the text they are anchored to" (screenshot: thread to the right of the paragraph, timestamp wrapping).

- [x] Red (browser): the open thread is below the block text, full block width.
- [x] Thread head keeps author and time on one line.
- The thread is a sibling after its block (block lookups use `.pw-block` rows). Actions follow Final: state line, then Reply, Ask Pi, Resolve, gap, Delete; sent threads show the job phase; resolved shows Reopen. Red/green: tests/browser/design.cjs.
