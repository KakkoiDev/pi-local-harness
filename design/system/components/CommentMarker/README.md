# CommentMarker

A small numbered box after a commented passage, plus the underline on the passage itself.

- Passage: `.pw-anchor` (solid 2px underline, open), `.pw-anchor--sent` (dotted, sent to Pi), `.pw-anchor--resolved` (1px dotted, only when Show resolved is on).
- Marker: `<button class="pw-mark" aria-expanded>`; open thread inverts; resolved uses `.pw-mark--resolved` (dotted border).
- Numbers follow document order. Deleted comments have no marker.
