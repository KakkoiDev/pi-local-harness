# ConversationTrash

**Existing vs Proposed.** Existing: none for conversations. Decided (round 19, A9 and A4, owner-delegated 21 Oct 2026; design only, not implemented): Delete Conversation… moves a conversation — its messages, what Pi used for each answer (sources, coverage, receipts) and its draft versions — to a local conversation Trash as one recoverable operation. Discarded draft versions go there too. The Trash lists them; an item opens read only; **Restore** brings it back. No permanent delete, no retention period. Shared by the dashboard Ask pane (B) and project chat (C reuses this markup by name).

Boards: R19_AskTrash, R19_AskActions (entry and delete), Ph19_AskTrash, R19_AskStrings, R19_AskWalk. CSS: `scripts/round19_b.css` (`.pw-trash*`, `.pw-convo__trash`).

## Anatomy

- Entry: the history list (ConversationList) ends with `button.pw-convo__trash[role=menuitem]` “Trash” + item count.
- `section.pw-trash[aria-labelledby]` replaces the conversation view in the pane:
  - head `.pw-trash__head`: **‹ Conversations** (or **‹ Trash** in a detail) + `h3.pw-trash__title`;
  - body `.pw-trash__body`: `p.pw-trash__note` “Deleted conversations and draft versions stay here until you restore them.”; `h4.pw-trash__sub` “Conversations · 2” / “Draft versions · 1”; `ul.pw-trash__list` of `button.pw-trash__item` (`span.pw-trash__t` title, `span.pw-trash__m` “All projects (5) · deleted Today 15:20 · 4 messages” or “Conflicts in two apps · discarded Today 15:02”);
  - detail: `p.pw-trash__ro` “In the Trash · read only. Restoring puts it back in your conversations; nothing runs again.” + `.pw-trash__detail` (the read-only transcript, or the draft text) + `.pw-trash__foot` with **Restore** (default) and `p.pw-trash__status`.

## States

| State | What shows |
| --- | --- |
| Idle | The list, newest first. |
| Loading | “Loading the Trash…” (role=status). |
| Empty | “The Trash is empty.” |
| Error | “Couldn't load the Trash.” + **Try Again** (role=alert). |
| Disabled | Restore on a draft version whose conversation is itself in the Trash: disabled, “Restore the conversation first.” |
| In progress | “Restoring…” (aria-disabled; repeat presses do nothing). |
| Stale / idempotent | Restored meanwhile in another window: “This conversation is already back in your list.” + **Open It**. |
| Conflict | Its link is held by another conversation: “Can't restore: another conversation uses this link. Nothing was changed.” — never overwrites; the item stays. |
| Access ended | Restore rechecks access: the title is neutral (“Conversation · 20 Oct 14:31”) and answers that used the project stay withheld, in the list, the detail and after restore. A project merely removed by its owner keeps decision 11. |

## Rules

- Who: the conversation's owner (the signed-in person). Delete is refused while a request is running or queued: “This conversation has a request running or queued. Stop or cancel it first.” + **Show Request** (opens the request's own location; nothing is cancelled implicitly).
- Persistence: harness host; deleted conversations keep their ids and links. Undo (toast, or ⌘Z while it shows) reverses the delete; after a reload, Restore from the Trash.
- Restore: puts the conversation back in the list with its id/link, opens it, toast “Conversation restored.”; focus in the composer. It never resumes work, never re-sends, never changes a phase. A draft version returns to the version list, never into the field.
- No permanent-delete control and no retention period.

## Texts (EN / JA)

| English | 日本語 |
| --- | --- |
| Trash | ゴミ箱 |
| ‹ Conversations · ‹ Trash | ‹ 会話 · ‹ ゴミ箱 |
| Deleted conversations and draft versions stay here until you restore them. | 削除した会話と下書きの版は、元に戻すまでここに残ります。 |
| Conversations · {n} / Draft versions · {n} | 会話 · {n} / 下書きの版 · {n} |
| deleted {when} · {n} messages / discarded {when} | {when} に削除 · メッセージ {n} 件 / {when} に破棄 |
| In the Trash · read only. Restoring puts it back in your conversations; nothing runs again. | ゴミ箱内 · 読み取り専用。元に戻すと会話の一覧に戻ります。何も再実行されません。 |
| Restore · Restoring… | 元に戻す · 元に戻しています… |
| Conversation restored. | 会話を元に戻しました。 |
| This conversation is already back in your list. · Open It | この会話はすでに一覧に戻っています。 · 開く |
| Can't restore: another conversation uses this link. Nothing was changed. | 元に戻せません: 別の会話がこのリンクを使っています。何も変更していません。 |
| Restore the conversation first. | 先に会話を元に戻してください。 |
| Couldn't restore. It's still in the Trash, with its draft versions. · Try Again | 元に戻せませんでした。下書きの版と一緒にゴミ箱に残っています。 · 再試行 |
| The Trash is empty. · Loading the Trash… · Couldn't load the Trash. · Try Again | ゴミ箱は空です。 · ゴミ箱を読み込んでいます… · ゴミ箱を読み込めませんでした。 · 再試行 |
| Delete “{title}”? / It moves to the Trash with its messages, what Pi used for each and its draft versions. You can restore it from the Trash. / Cancel · Move to Trash | 「{title}」を削除しますか？ / メッセージ、それぞれで Pi が使ったもの、下書きの版と一緒にゴミ箱に移動します。ゴミ箱から元に戻せます。 / キャンセル · ゴミ箱に移動 |
| Conversation moved to the Trash. · Undo | 会話をゴミ箱に移動しました。 · 取り消す |

## Data (implementation dependencies)

```json
{"trash": [{"kind": "conversation", "id": "ov-12", "link": "/overview?c=ov-12", "title": "Offline sync across apps", "title_hidden": false,
  "deleted_at": "2026-10-21T15:20:00", "messages": 4, "draft_versions": 2},
 {"kind": "draft_version", "id": "dv_3", "conversation_id": "ov-7", "discarded_at": "2026-10-21T15:02:00"}]}
```

One transactional delete/restore (conversation + messages + receipts + draft versions); idempotent restore keyed by id; link-conflict detection; access recheck on list, detail and restore (System 1 records, never model prose).

## Focus, keyboard, live

The list is one tab stop (↑↓, Return opens). ‹ Trash returns to the list with focus on the item opened. Restore moves focus to the restored conversation's composer. Status lines are polite; the conflict line is an alert. Escape in an alert returns focus to its opener.

## Phone

Its own screen (back “‹ Conversations”), 56 px items, 44 px buttons.

## Inverse

Tokens only.

## Don't

- Don't add permanent delete, emptying or a retention timer.
- Don't restore over an existing conversation, and don't resume or re-send anything on restore.
- Don't reveal a withheld answer's text or a generated title derived from a project the person can no longer open.

## Walkthrough (Given / When / Then)

1. Given “Offline sync across apps” is in the Trash. When I open it and press “Restore”. Then it opens in my conversations with the same link and “Conversation restored.” is announced; nothing runs.
2. Given it was restored in another window. When I press “Restore”. Then “This conversation is already back in your list.” shows with “Open It”.
3. Given its link is now used by another conversation. When I press “Restore”. Then “Can't restore: another conversation uses this link. Nothing was changed.” shows.
4. Given my access to Kanji Cards ended while it was in the Trash. When I restore it. Then it is titled “Conversation · 20 Oct 14:31” and the answer stays withheld.

### Follow-up decisions (21 Oct)

Decision record: design/briefs/round-19-follow-up-decisions.md (3, 4, 12, 13). Boards: R19_AskRemote, R19_AskRemoved, Ph19_AskRemote. New classes (additive): `div.pw-trash__notice`, `p.pw-trash__why`.

- **Deleted in another window (3).** This window stops editing and sending and shows the read-only detail with `div.pw-trash__notice[role=status]`: “This conversation was moved to the Trash in another window.” (この会話は別のウインドウでゴミ箱に移動されました。) and, with unsaved text, “Your unsaved text is kept as a draft version with it.” (未保存の文字は、下書きの版として一緒に残しています。) + **Restore** (元に戻す). The kept version is listed read only at the top of the detail. Late or retried saves are never submitted, so nothing resurrects the conversation. Restore is explicit, rechecks access and never resumes requests. Focus moves to the detail heading; one polite announcement.
- **Restore copy (13).** “Restore the conversation first.” (先に会話を元に戻してください。) for a draft version whose conversation is in the Trash (Restore `aria-disabled`, described by it); “Conversation restored.” (会話を元に戻しました。); failure: “Couldn't restore. It's still in the Trash, with its draft versions.” + **Try Again** (元に戻せませんでした。下書きの版と一緒にゴミ箱に残っています。 / 再試行) — role=alert; nothing lost or half-restored; the item and its draft versions stay. JA restore vocabulary: 元に戻す (restore) ≠ 取り消す (undo). Not native-speaker reviewed.
- **Removed projects (4).** A group “Removed from the list · {n}” (一覧から外したプロジェクト · {n}) keyed by the stable project id, with removal metadata: item “Kanji Cards” · “removed from the list 21 Oct 15:30 · 3 conversations” ({when} に一覧から外しました · 会話 {n} 件). Detail notice: “Kanji Cards was removed from the list on 21 Oct.” / “This is about the project list. The project's files weren't deleted.” / “To restore these conversations, add the same project again with Add Existing Folder….” (Kanji Cards は 10月21日に一覧から外されました。 / プロジェクトの一覧についての表示です。ファイルは削除されていません。 / これらの会話を元に戻すには、「既存のフォルダーを追加…」で同じプロジェクトをもう一度追加してください。). Its conversations are listed read only; **Restore** is `aria-disabled`, described by `p.pw-trash__why` “Add Kanji Cards again to restore its conversations.” (会話を元に戻すには Kanji Cards をもう一度追加してください。). Re-adding the same identity reconnects them (worker A's confirmation copy) and the group disappears; a different project reusing the name or path does not reconnect. Access revocation (not removal) withholds the group entirely: no name, title or count.
- **Theme (12).** Dark and light wrappers side by side with a selected item (R19_AskRemoved; preview).
- Who: the owner of the conversations. Persistence: host, keyed by project id; the project folder is never moved or deleted. Cancellation: N/A (read only). Focus: ‹ Trash returns to the item.

Given/When/Then: (1) Given I removed Kanji Cards from the list, When I open Trash, Then “Removed from the list · 1” shows Kanji Cards with 3 read-only conversations and Restore disabled with “Add Kanji Cards again to restore its conversations.” (2) Given I add the same project again, Then the group is gone and its conversations are back. (3) Given a different project now uses the name, Then nothing reconnects. (4) Given Restore fails, Then “Couldn't restore. It's still in the Trash, with its draft versions.” with “Try Again”.

**Closeout (21 Oct).** Approved (decision 6): the group label “Removed from the list” (一覧から外したプロジェクト), with the explanation under the group heading and in the detail: “This is about the project list. The project's files weren't deleted.” (プロジェクトの一覧についての表示です。ファイルは削除されていません。; `p.pw-trash__why`, referenced by the list's `aria-describedby`). Timestamps (decision 3): a draft version item reads “Draft version · iPhone · Saved 14:55” only for a host-confirmed save; a version kept from a remote deletion reads “Kept 15:21”; a single unexplained time reads “Recorded …” or is omitted. Boards: R19_AskRemoved, R19_AskRemote, R19_AskTrash.
