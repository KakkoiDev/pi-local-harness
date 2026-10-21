# CompactionMarker

Where the harness summarised a long conversation, in the Chat transcript, after the last message it summarised.

- Markup: `<details class="pw-compacted"><summary><span class="pw-compacted__label">Earlier conversation summarised · 14:01 · 38 messages <span class="pw-compacted__toggle">Show Summary</span></span></summary><div class="pw-compacted__body">…</div></details>`. Double rules either side, like an info bar; the toggle text becomes Hide Summary when open.
- The messages above stay on screen for the person, unchanged. The marker says what changed for Pi: the first line of the body reads “Pi now remembers everything above as this summary. The messages stay here for you.”, then the summary text the harness wrote (Markdown, rendered like a Message body).
- Compact Now (Agent menu) adds a marker at once and shows the toast “Conversation summarised.” with no Undo; the meter drops to the new size.
- New Conversation… starts an empty transcript whose first line is `.pw-convline`: “‹ Earlier conversation · 13 Oct · 84 messages · kept, read only”. The link opens the old one read only at `/p/<project>/chat/earlier/<id>`: the composer and meter are hidden and a `.pw-readonly` bar under the toolbar reads “Earlier conversation · 13 Oct, 09:12 – 14:30 · 84 messages · read only” with **Back to Current** (default button). Board: S_Earlier. Agent › Earlier Conversations ▸ lists all of them, newest first.

## Round 18 addendum (proposed, awaiting approval)

**Q9 · receipts survive compaction.** Proposed: compaction summarises earlier turns for Pi, but the transcript and every per-message context receipt above the marker stay unchanged. The marker body adds a bold second line after “Pi now remembers everything above as this summary. The messages stay here for you.”: **“Receipts above still show what Pi had when it answered.”** (JA “上の記録は、Pi が答えたときに使ったものをそのまま示します。”).

- **New Conversation…** moves the conversation and its receipts to Earlier Conversations. The read-only view opens receipts as before.
- A **Delete Conversation…** button in the read-only bar opens an alert. Title: “Delete the earlier conversation from 13 Oct?”. Body: “Deletes 14 messages and what Pi used for each.”. Buttons: **Delete** (left, `pw-dialog__danger`) and **Cancel** (default; Esc cancels). JA: “10月13日の以前の会話を削除しますか？” / “14 件のメッセージと、それぞれで Pi が使ったものを削除します。” / “削除” / “キャンセル”. The delete command itself is new in this proposal.
- Narrow widths: `.pw-compacted--wrap` lets the label wrap and draws the double rules above and below.
- Proposed JA for the existing marker (none existed): “以前の会話を要約しました · {time} · {n} 件のメッセージ”, “要約を表示 / 要約を隠す”, “Pi は上の内容をこの要約として覚えています。メッセージはここに残ります。”.
- Boards: R18A_ReceiptLifetime, Ph18A_ReceiptLifetime.
- Alternative (not recommended): receipts are dropped at compaction. The summaries above the marker disappear, and the marker says “What Pi used before 14:01 isn’t kept.” (JA “14:01 より前に Pi が使ったものは保存していません。”).
