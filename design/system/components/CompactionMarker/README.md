# CompactionMarker

Where the harness summarised a long conversation, in the Chat transcript, after the last message it summarised.

- Markup: `<details class="pw-compacted"><summary><span class="pw-compacted__label">Earlier conversation summarised · 14:01 · 38 messages <span class="pw-compacted__toggle">Show Summary</span></span></summary><div class="pw-compacted__body">…</div></details>`. Double rules either side, like an info bar; the toggle text becomes Hide Summary when open.
- The messages above stay on screen for the person, unchanged. The marker says what changed for Pi: the first line of the body reads “Pi now remembers everything above as this summary. The messages stay here for you.”, then the summary text the harness wrote (Markdown, rendered like a Message body).
- Compact Now (Agent menu) adds a marker at once and shows the toast “Conversation summarised.” with no Undo; the meter drops to the new size.
- New Conversation… starts an empty transcript whose first line is `.pw-convline`: “‹ Earlier conversation · 13 Oct · 84 messages · kept, read only”. The link opens the old one read only at `/p/<project>/chat/earlier/<id>`: the composer and meter are hidden and a `.pw-readonly` bar under the toolbar reads “Earlier conversation · 13 Oct, 09:12 – 14:30 · 84 messages · read only” with **Back to Current** (default button). Board: S_Earlier. Agent › Earlier Conversations ▸ lists all of them, newest first.

## Round 18 addendum (settled or superseded in round 19 — see Round 19)

Revised 21 Oct after review.

**Q9 · receipts and the conversation's lifetime.** Proposed:

- **Compaction.** Earlier turns are summarised for Pi, but the transcript and every per-message context receipt above the marker stay unchanged. The marker body adds a bold line after “Pi now remembers everything above as this summary. The messages stay here for you.”: **“Receipts above still show what Pi had when it answered.”** (JA “上の記録は、Pi が答えたときに使ったものをそのまま示します。”).
- **New Conversation…** (unchanged): the earlier conversation stays read only, with its receipts.
- **Clearing or deleting.** Either moves the conversation to the **Trash** with its messages and receipts, and restoring brings both back. **Delete Conversation…** is in two places:
  - Superseded: the conversation's menu: Agent › Delete Conversation… for the current one; Chat ▾ › Delete Conversation… on the phone;
  - Superseded: the history list: Agent › Earlier Conversations ▸, then → on an item opens **Open Read Only** · **Delete Conversation…**.
- **The alert (B's copy).** Title “Delete “Class Notes · 13 Oct 09:12”?”, body “It moves to the Trash with its messages and what Pi used for each. You can restore it from the Trash.”, buttons **Cancel** (default; Esc) · **Move to Trash**. JA: “「Class Notes · 10月13日 09:12」を削除しますか？” / “メッセージと、それぞれで Pi が使ったものと一緒にゴミ箱に移動します。ゴミ箱から元に戻せます。” / キャンセル · ゴミ箱に移動.
- **After moving.** A toast reads “Conversation moved to the Trash.” with **Undo** (JA “会話をゴミ箱に移動しました。” / “取り消す”). In the Trash, **Restore** (元に戻す).
- **Narrow widths.** `.pw-compacted--wrap` lets the label wrap, with double rules above and below.
- **Proposed JA for the existing marker (none existed):** “以前の会話を要約しました · {time} · {n} 件のメッセージ”, “要約を表示 / 要約を隠す”, “Pi は上の内容をこの要約として覚えています。メッセージはここに残ります。”.
- **Boards:** R18A_ReceiptLifetime, Ph18A_ReceiptLifetime, Ph18A_ConversationMenu.
- **Removed in this revision:** the Delete button in the read-only bar, and the alert “Delete the earlier conversation from 13 Oct?” / “Deletes 14 messages…” (deleting no longer erases at once; it moves to the Trash).
- **Alternative (not recommended):** receipts are dropped at compaction. The marker says “What Pi used before 14:01 isn’t kept.” (JA “14:01 より前に Pi が使ったものは保存していません。”).

## Round 19 (decided, owner-delegated 21 Oct 2026)

Design only; not implemented. Boards: R19_ProjectChatReceipts, R19_ProjectChatActions, Ph19_ProjectChatActions, Ph19_ProjectChatTrash.

- **Compaction (settled).** It keeps receipts and evidence references; the marker line “Receipts above still show what Pi had when it answered.” stays. It does not mean the source files are unchanged.
- **Conversation commands (A6/A9).** The conversation's commands live in **Conversation actions** (⋯) beside the conversation title in the Chat toolbar, and on the phone in a ⋯ under the bar that opens a sheet. The items are **New Conversation**, **Earlier Conversations…** and **Delete Conversation…**. Earlier Conversations… lists conversations newest first, with a ⋯ per row (→ opens it; Delete Conversation…), and ends with **Trash**. Never in Agent or Chat ▾ (round 9).
- **Delete and Trash.** B's ConversationTrash alert, refusal (“This conversation has a request running or queued. Stop or cancel it first.” + Show Request), toast with Undo, Trash list, detail, Restore, already-back and conflict states, all unchanged. A deleted project conversation keeps its messages, receipts and draft versions together.
- **Superseded:** the round 9 era text above that puts Earlier Conversations in the Agent menu (“Agent › Earlier Conversations ▸ lists all of them”). It now lives in Conversation actions › Earlier Conversations….
- **New Conversation (unchanged).** It keeps the earlier conversation read only.
