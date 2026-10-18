# Threads

App Block card (Collaboration). Replies to one message, opened beside the conversation: the first message on top, its replies in order, and a reply box, with the option to also send the reply to the channel.

- Basecoat: `btn`, `avatar`, `avatar-group`, `textarea`, `input` (checkbox), `badge`
- Route: `/c/{channel}/t/{message}` (the panel's own address, so a thread can be linked)
- Needs: Web: `GET /threads/{id}`, `POST /threads/{id}/replies`. No server: `store.threads.get/reply` (one device only). Blocks: Channels, Reactions, Mentions, Presence, Notifications
- Used in: AppChat, AppForum, AppCode

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/Threads.html` (33 lines of HTML).

## States
- No replies: Summary hidden; the message's hover actions show Reply in Thread. The panel shows the first message and `thread.first`.
- Loading: The first message (already known) and three `skeleton` reply rows.
- New replies while open: They appear at the bottom; if you scrolled up, a `btn` `thread.new` (“2 new replies”) at the bottom jumps down.
- Unread: In the channel the summary reads `thread.unread` in `font-semibold`; a Threads entry in the side panel lists them.
- Sending: The reply shows at once, `opacity-60`, with `thread.sending`; failed: `text-destructive` `thread.failed` and Retry / Delete.
- First message deleted: Its row reads `thread.deleted`; replies stay.
- Following: A `btn` Follow / Following (`aria-pressed`) in the header: following notifies on every reply.

## Texts
(Key | English | 日本語)
- `thread.title`: Thread | スレッド
- `thread.replies`: {count} replies | {count} 件の返信
- `thread.last`: Last reply {time} | 最終返信 {time}
- `thread.count`: {count} replies | {count} 件の返信
- `thread.reply_label`: Reply | 返信
- `thread.placeholder`: Reply… | 返信を入力…
- `thread.also_send`: Also send to #{channel} | #{channel} にも送信
- `thread.send`: Reply | 返信
- `thread.close`: Close thread | スレッドを閉じる
- `thread.first`: No replies yet. Start the thread. | まだ返信はありません。最初の返信をしましょう。
- `thread.new`: {count} new replies | 新しい返信 {count} 件
- `thread.unread`: {count} new replies | 新しい返信 {count} 件
- `thread.sending`: Sending… | 送信中…
- `thread.failed`: Not sent. | 送信できませんでした。
- `thread.retry`: Retry | 再送信
- `thread.deleted`: This message was deleted. | このメッセージは削除されました。
- `thread.follow`: Follow | フォロー
- `thread.following`: Following | フォロー中
- `thread.reply_in`: Reply in Thread | スレッドで返信

## Keyboard and focus
1. Close → 2. Follow → 3. the replies (each reply's actions on focus) → 4. Reply box → 5. Also send → 6. Reply.
- Opening a thread moves focus to the reply box; Esc (when the box is empty) closes the panel and returns focus to the summary button.
- Return sends, Shift Return adds a line (same as the channel composer).

## Phone
- The thread is a full screen with a back button (`←`, label `thread.close`) instead of a side panel; the channel stays underneath.
- The reply box sits at the bottom above the keyboard; the list scrolls.

## Data
```json
{"id": "m_88", "channel": "field-trip", "root": {"author": "Ren Sato", "text": "Who can bring the class banner?", "at": "2026-10-18T10:04:00+09:00"},
 "replies": [{"id": "m_91", "author": "Kana Abe", "text": "I can, it’s in the art room.", "at": "2026-10-18T10:12:00+09:00"}],
 "following": true, "unread": 0}
```

- Web: `GET /threads/m_88` → panel fragment (`hx-push-url` to the thread address); `POST /threads/m_88/replies` `{text, also_channel}` → 201 and the reply `<li>`; others get it over the live channel.
- No server: replies are stored with the message; there is nobody else to see them.

## Don't
- Don't nest threads inside threads.
- Don't move the channel's scroll position when the thread opens.
- Don't mark replies read until they have been on screen.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Threads` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
