# 148: Messages sent while Pi works join one waiting request

Kind: code

Request 2026-10-13: "when sending several queries to a chat while it is processing the previous request, all the messages should be concatenated into 1 new one, not many messages".

- [x] Red (unit): a chat message added while the same chat already has a waiting (not running) message joins it: one request, texts separated by a blank line, attachments together (at most eight, else a new request). Other chats, comment and whole-file requests never join. The joined request survives a restart.
- [x] The composer toasts "Added to your waiting message: Pi gets both as one request."
- [x] Green: unit, browser (two follow-ups during a running request become one waiting request).
