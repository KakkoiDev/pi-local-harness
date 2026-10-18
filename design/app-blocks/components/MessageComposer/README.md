# MessageComposer

The chat composer: a growing message field with mentions, emoji, files, Send and Schedule for Later, and the same form for editing a message.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `btn`, `button-group`, `dropdown-menu`, `badge`, `avatar` |
| Route | Inside a channel, a DM or a thread (Channels, Threads) |
| Needs | Web: `POST /channels/<id>/messages`, `PATCH /messages/<id>`, `POST /uploads`; needs a server |
| Links to | Channels, Threads, Mentions, FileUpload, DatePicker, TimePicker, OfflineBanner; used in AppChat |

## Markup

```html
<form id="composer" class="relative grid gap-2 rounded-lg border bg-background p-2 focus-within:ring-[3px] focus-within:ring-ring/50" method="post" action="/channels/field-trip/messages" novalidate>
  
  <label class="sr-only" for="composer-text" data-t="composer.label">Message #field-trip</label>
  <textarea id="composer-text" name="text" rows="1" maxlength="8000" class="field-sizing-content max-h-48 min-h-10 resize-none bg-transparent px-2 py-1.5 text-sm outline-none" placeholder="Message #field-trip" data-t-placeholder="composer.placeholder" aria-describedby="composer-hint"></textarea>
  
  <div class="flex items-center gap-1">
    <label class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Attach a file" data-t-label="composer.attach"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg><input class="sr-only" type="file" name="files" multiple tabindex="-1"></label>
    <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Add an emoji" data-t-label="composer.emoji" aria-haspopup="dialog"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></button>
    <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Mention someone" data-t-label="composer.mention" aria-haspopup="listbox" aria-controls="mention-list"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg></button>
    <span class="flex-1"></span>
    <span id="composer-hint" class="hidden text-xs text-muted-foreground @3xl:inline" data-t="composer.hint">Return to send · Shift+Return for a new line</span>
    <div class="button-group">
      <button class="btn" data-size="sm" type="submit" disabled data-t="composer.send"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>Send</button>
      <div class="dropdown-menu" id="send-menu">
        <button class="btn" data-size="icon-sm" type="button" id="send-menu-trigger" aria-haspopup="menu" aria-controls="send-menu-menu" aria-expanded="false" aria-label="More send options" data-t-label="composer.more" disabled><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
        <div id="send-menu-popover" data-popover aria-hidden="true">
          <div role="menu" id="send-menu-menu" aria-labelledby="send-menu-trigger">
            <div role="menuitem" data-t="composer.schedule"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Schedule for Later…</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</form>

<!-- a file chip while uploading -->
<li class="badge gap-1" data-variant="secondary" aria-busy="true"><span data-t="composer.uploading">Uploading route.png…</span><button class="btn" data-variant="ghost" data-size="icon-xs" type="button" aria-label="Remove route.png" data-t-label="composer.remove_file">✕</button></li>

<!-- the mention list with no match -->
<p class="px-2 py-1.5 text-sm text-muted-foreground" role="status" data-t="composer.no_people">No one called “kenji” in this channel.</p>

<!-- too long: under the field -->
<p id="composer-count" class="px-1 text-sm text-destructive" data-t="composer.too_long">4,012 / 4,000 characters: shorten it to send.</p>

<!-- after scheduling -->
<p class="flex items-center gap-2 text-sm text-muted-foreground" role="status"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span data-t="composer.scheduled">Scheduled for Fri 23 Oct, 07:30</span></p>

<!-- typing @: the mention list opens above the field (role="listbox", the field gets aria-controls and aria-activedescendant) -->
<div id="mention-list" role="listbox" aria-label="People in #field-trip" data-t-label="composer.mention_list" class="grid gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"><div role="option" id="mention-ren" aria-selected="true" class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"><span class="avatar" data-size="sm"><span>RS</span></span><span class="font-medium">Ren Sato</span><span class="text-muted-foreground">@ren</span></div><div role="option" id="mention-rena" aria-selected="false" class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"><span class="avatar" data-size="sm"><span>RM</span></span><span class="font-medium">Rena Mori</span><span class="text-muted-foreground">@rena</span></div></div>

<!-- read-only channel: replaces the form -->
<div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><span data-t="composer.no_permission">Only members can post in #announcements.</span><button class="btn" data-size="sm" type="button" data-t="composer.join">Join Channel</button></div>
```

- One field that grows with its text (`field-sizing-content`, up to `max-h-48`, then it scrolls). The label is the channel or person (`composer.label`), visually hidden; the placeholder says the same.
- **Send** is disabled while the field is empty and there is no file. The arrow beside it (a Basecoat dropdown) holds **Schedule for Later…**, which opens a dialog with DatePicker and TimePicker (so Japanese reads 10月23日 07:30).
- Files: the paperclip is a real file input; each chosen file becomes a chip above the field with a remove button; uploading shows `composer.uploading` in the chip until it's done.
- **Mentions**: typing `@` (or pressing the @ button) opens the people list above the field; it filters as you type.
- **Edit mode** reuses the same form for one of your messages: a bar above (`composer.editing`), Cancel and Save instead of Send.

## States

| State | What changes |
| --- | --- |
| Empty | Send and its menu are `disabled`. |
| Typing | Send is enabled. A draft is kept per channel (store or `sessionStorage`) and restored when you come back. |
| Mention list | Opens on `@`; the textarea gets `aria-controls="mention-list"` and `aria-activedescendant` pointing at the highlighted option. No match: the list shows `composer.no_people` with the query. |
| Files | One chip per file (`composer.remove_file` on its ×). While uploading the chip text is `composer.uploading` and Send waits. |
| Too long | Over 4,000 characters the field gets `aria-invalid="true"`, `#composer-count` shows `composer.too_long` with the count, and Send is disabled. |
| Editing | The bar `composer.editing` and hint `composer.edit_hint`; Cancel / Save replace Send; the tools are hidden. |
| Sending | The message appears in the list at once (dimmed) and the field empties; on failure the message shows Retry in Channels. |
| Offline | Sent messages wait in the list with `composer.queued`; the status line `composer.offline` shows under the field. They send in order when the connection returns (OfflineBanner). |
| Scheduled | After scheduling: the status line `composer.scheduled` (filled with the date and time) under the field; the message waits in a Scheduled list. |
| Can’t post | The form is replaced by `composer.no_permission` with **Join Channel** when joining is allowed. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `composer.label` | Message {channel} | {channel}にメッセージを送信 |
| `composer.placeholder` | Message {channel} | {channel}にメッセージを送信 |
| `composer.attach` | Attach a file | ファイルを添付 |
| `composer.emoji` | Add an emoji | 絵文字を追加 |
| `composer.mention` | Mention someone | メンション |
| `composer.hint` | Return to send · Shift+Return for a new line | Returnで送信・Shift+Returnで改行 |
| `composer.send` | Send | 送信 |
| `composer.more` | More send options | 送信オプション |
| `composer.schedule` | Schedule for Later… | 送信日時を指定… |
| `composer.files` | Attachments | 添付ファイル |
| `composer.remove_file` | Remove {file} | {file}を削除 |
| `composer.uploading` | Uploading {file}… | {file}をアップロード中… |
| `composer.editing` | Editing your message | メッセージを編集中 |
| `composer.edit_hint` | Esc to cancel · Return to save | Escでキャンセル・Returnで保存 |
| `composer.cancel` | Cancel | キャンセル |
| `composer.save` | Save | 保存 |
| `composer.mention_list` | People in {channel} | {channel}のメンバー |
| `composer.no_people` | No one called “{query}” in this channel. | 「{query}」という人はこのチャンネルにいません。 |
| `composer.too_long` | {count} / {max} characters: shorten it to send. | {count} / {max}文字：送信するには短くしてください。 |
| `composer.offline` | You’re offline. Messages send when you’re back. | オフラインです。接続が戻ると送信されます。 |
| `composer.queued` | Waiting to send | 送信待ち |
| `composer.scheduled` | Scheduled for {time} | {time}に送信予定 |
| `composer.no_permission` | Only members can post in {channel}. | {channel}に投稿できるのはメンバーだけです。 |
| `composer.join` | Join Channel | チャンネルに参加 |

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
