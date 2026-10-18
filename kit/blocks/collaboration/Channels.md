# Channels

App Block card (Collaboration). The chat itself: a list of channels and direct messages with unread marks, the open conversation with day separators, who is typing, and the message box.

- Basecoat: `sidebar`, `badge`, `avatar`, `btn`, `textarea`, `dropdown-menu`
- Route: `/c/{channel}`, `/dm/{person}`
- Needs: needs a server (others must receive the messages): `GET /c/{id}/messages?before=`, `POST /c/{id}/messages`, a live connection (SSE `/live` or WebSocket; htmx `hx-sse`) for new messages, typing and presence. Multiplayer real time on a no-server package uses p2p-core instead. Blocks: Threads, Reactions, Mentions, Presence, FileUpload, Notifications, InfiniteScroll
- Used in: AppChat, AppCode, AppCourse

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/Channels.html` (36 lines of HTML).

## States
- Unread channel: Its link is `font-semibold`; with mentions a `badge` count (`aria-label` “5 unread”). Muted channels: `text-muted-foreground`, no badge.
- New since last visit: A red “New” separator above the first unread message; the view opens there.
- Typing: `#typing` reads `chat.typing_one`, `chat.typing_two` or `chat.typing_many`; cleared 5 s after the last keystroke. Empty line keeps its height (no jump).
- Loading older: Scrolling to the top loads 50 more (InfiniteScroll) with a `skeleton` row; the position stays.
- Empty channel: `chat.empty` with the channel's description and `chat.empty_hint`.
- Sending / failed: As Threads: dimmed while sending, `chat.failed` with Retry.
- Disconnected: A banner under the header `chat.offline` (OfflineBanner); messages typed meanwhile wait and send on reconnect.
- Not a member: The composer is replaced by `chat.join_hint` and a Join Channel button.
- Direct message: Header shows the person's avatar with status and their local time.

## Texts
(Key | English | 日本語)
- `chat.channels`: Channels | チャンネル
- `chat.dms`: Direct messages | ダイレクトメッセージ
- `chat.members`: {count} members | メンバー {count} 人
- `chat.today`: Today | 今日
- `chat.yesterday`: Yesterday | 昨日
- `chat.new`: New | 新着
- `chat.typing_one`: {name} is typing… | {name} さんが入力中…
- `chat.typing_two`: {name} and {name2} are typing… | {name} さんと {name2} さんが入力中…
- `chat.typing_many`: Several people are typing… | 複数の人が入力中…
- `chat.message_label`: Message #{channel} | #{channel} へのメッセージ
- `chat.send`: Send | 送信
- `chat.attach`: Attach a file | ファイルを添付
- `chat.unread`: {count} unread | 未読 {count} 件
- `chat.empty`: This is the start of #{channel}. | ここが #{channel} の始まりです。
- `chat.empty_hint`: Say hello, or share what this channel is for. | あいさつや、チャンネルの目的を書いてみましょう。
- `chat.failed`: Not sent. | 送信できませんでした。
- `chat.offline`: You’re offline. Messages will send when you’re back. | オフラインです。再接続すると送信されます。
- `chat.join_hint`: You’re reading #{channel}. Join to send messages. | #{channel} を閲覧中です。参加するとメッセージを送れます。
- `chat.join`: Join Channel | チャンネルに参加
- `chat.online`: Online | オンライン

## Keyboard and focus
1. Channel list (each link) → 2. channel header actions → 3. messages (one tab stop; ↑ ↓ move between messages) → 4. Attach → 5. Message box → 6. Send.
- Opening a channel puts focus in the message box. Return sends, Shift Return adds a line, ↑ in an empty box edits your last message.
- `Ctrl K` (⌘K) jumps to a channel or person (CommandPalette); `Alt ↑/↓` moves between channels; `Esc` marks the channel read.

## Phone
- The channel list is its own screen (the app's home); opening a channel pushes the conversation full screen with a back button and the unread count of other channels on it.
- The composer stays above the keyboard; Attach opens the system file sheet.
- Long-press a message for actions (Reply in Thread, React, Copy, Edit, Delete) in a sheet.

## Data
```json
{"channel": {"id": "field-trip", "name": "field-trip", "topic": "Plans for Friday’s museum visit", "members": 28, "muted": false, "last_read": "m_86"},
 "messages": [{"id": "m_88", "author": {"id": "u_12", "name": "Ren Sato"}, "text": "The museum confirmed our booking.", "at": "2026-10-18T10:04:00+09:00", "thread": {"replies": 4, "last": "2026-10-18T10:32:00+09:00"}, "reactions": []}],
 "typing": ["Kana Abe"]}
```

- Web: `POST /c/{id}/messages` → 201 + `<li>`; the live stream sends `message`, `typing`, `read`, `presence` events; `POST /c/{id}/read {last}` when the newest message has been on screen.
- Typing events are sent at most every 3 s while typing.

## Don't
- Don't poll every second; use the live connection.
- Don't move the scroll when new messages arrive while the reader is scrolled up; show a “new messages” button.
- Don't show read receipts per message; the unread separator is enough.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Channels` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
