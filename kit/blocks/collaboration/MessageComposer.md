# MessageComposer

App Block card (Collaboration). The chat composer: a growing message field with mentions, emoji, files, Send and Schedule for Later, and the same form for editing a message.

- Basecoat: `btn`, `button-group`, `dropdown-menu`, `badge`, `avatar`
- Route: Inside a channel, a DM or a thread (Channels, Threads)
- Needs: Web: `POST /channels/<id>/messages`, `PATCH /messages/<id>`, `POST /uploads`; needs a server
- Links to: Channels, Threads, Mentions, FileUpload, DatePicker, TimePicker, OfflineBanner; used in AppChat

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/MessageComposer.html` (42 lines of HTML).

- One field that grows with its text (`field-sizing-content`, up to `max-h-48`, then it scrolls). The label is the channel or person (`composer.label`), visually hidden; the placeholder says the same.
- **Send** is disabled while the field is empty and there is no file. The arrow beside it (a Basecoat dropdown) holds **Schedule for Later…**, which opens a dialog with DatePicker and TimePicker (so Japanese reads 10月23日 07:30).
- Files: the paperclip is a real file input; each chosen file becomes a chip above the field with a remove button; uploading shows `composer.uploading` in the chip until it's done.
- **Mentions**: typing `@` (or pressing the @ button) opens the people list above the field; it filters as you type.
- **Edit mode** reuses the same form for one of your messages: a bar above (`composer.editing`), Cancel and Save instead of Send.

## States
- Empty: Send and its menu are `disabled`.
- Typing: Send is enabled. A draft is kept per channel (store or `sessionStorage`) and restored when you come back.
- Mention list: Opens on `@`; the textarea gets `aria-controls="mention-list"` and `aria-activedescendant` pointing at the highlighted option. No match: the list shows `composer.no_people` with the query.
- Files: One chip per file (`composer.remove_file` on its ×). While uploading the chip text is `composer.uploading` and Send waits.
- Too long: Over 4,000 characters the field gets `aria-invalid="true"`, `#composer-count` shows `composer.too_long` with the count, and Send is disabled.
- Editing: The bar `composer.editing` and hint `composer.edit_hint`; Cancel / Save replace Send; the tools are hidden.
- Sending: The message appears in the list at once (dimmed) and the field empties; on failure the message shows Retry in Channels.
- Offline: Sent messages wait in the list with `composer.queued`; the status line `composer.offline` shows under the field. They send in order when the connection returns (OfflineBanner).
- Scheduled: After scheduling: the status line `composer.scheduled` (filled with the date and time) under the field; the message waits in a Scheduled list.
- Can’t post: The form is replaced by `composer.no_permission` with **Join Channel** when joining is allowed.

## Texts
(Key | English | 日本語)
- `composer.label`: Message {channel} | {channel}にメッセージを送信
- `composer.placeholder`: Message {channel} | {channel}にメッセージを送信
- `composer.attach`: Attach a file | ファイルを添付
- `composer.emoji`: Add an emoji | 絵文字を追加
- `composer.mention`: Mention someone | メンション
- `composer.hint`: Return to send · Shift+Return for a new line | Returnで送信・Shift+Returnで改行
- `composer.send`: Send | 送信
- `composer.more`: More send options | 送信オプション
- `composer.schedule`: Schedule for Later… | 送信日時を指定…
- `composer.files`: Attachments | 添付ファイル
- `composer.remove_file`: Remove {file} | {file}を削除
- `composer.uploading`: Uploading {file}… | {file}をアップロード中…
- `composer.editing`: Editing your message | メッセージを編集中
- `composer.edit_hint`: Esc to cancel · Return to save | Escでキャンセル・Returnで保存
- `composer.cancel`: Cancel | キャンセル
- `composer.save`: Save | 保存
- `composer.mention_list`: People in {channel} | {channel}のメンバー
- `composer.no_people`: No one called “{query}” in this channel. | 「{query}」という人はこのチャンネルにいません。
- `composer.too_long`: {count} / {max} characters: shorten it to send. | {count} / {max}文字：送信するには短くしてください。
- `composer.offline`: You’re offline. Messages send when you’re back. | オフラインです。接続が戻ると送信されます。
- `composer.queued`: Waiting to send | 送信待ち
- `composer.scheduled`: Scheduled for {time} | {time}に送信予定
- `composer.no_permission`: Only members can post in {channel}. | {channel}に投稿できるのはメンバーだけです。
- `composer.join`: Join Channel | チャンネルに参加

## Keyboard and focus
1. The message field → 2. Attach → 3. Emoji → 4. Mention → 5. Send → 6. More send options.
- Return sends; Shift+Return adds a line. With a Japanese input method, Return while composing (`event.isComposing`) confirms the text and never sends.
- In the mention list: ↑ ↓ move, Return or Tab inserts `@name`, Esc closes it and keeps what you typed.
- ↑ in an empty field edits your last message (edit mode); Esc leaves edit mode without saving.

## Phone
- The form is the last item above the BottomBar (or replaces it inside a channel), with the safe area below it.
- The keyboard hint is hidden; Return makes a new line on phones and only Send sends.
- Emoji opens the system emoji keyboard hint instead of a picker; the mention list is full width above the field.

## Data
```json
{"request": {"channel": "field-trip", "text": "Bring the worksheet, @ren", "mentions": ["ren"],
             "files": [{"id": "f_91", "name": "route.png", "bytes": 182044}], "send_at": null, "edit_of": null},
 "message": {"id": 4021, "author": "aiko", "created": "2026-10-18T09:12:00+09:00", "state": "sent | queued | scheduled | failed"}}
```

- Web: `POST /channels/<id>/messages` (htmx swaps the new message into the list), `PATCH /messages/<id>` for edits, `POST /uploads` for each file first; `send_at` in ISO 8601 schedules. Live updates come over the app's WebSocket (Channels, Presence). Needs a server.
- No server: messages stay on this device (a personal notes-to-self chat); scheduling and mentions are hidden.

## Don't
- Don't send on Return while an input method is composing Japanese.
- Don't clear the person's text on a failed send.
- Don't build an emoji picker or a rich-text toolbar here; plain text with @mentions and files only.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> MessageComposer` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
