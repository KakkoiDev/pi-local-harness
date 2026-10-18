# Threads

Replies to one message, opened beside the conversation: the first message on top, its replies in order, and a reply box, with the option to also send the reply to the channel.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `btn`, `avatar`, `avatar-group`, `textarea`, `input` (checkbox), `badge` |
| Route | `/c/{channel}/t/{message}` (the panel's own address, so a thread can be linked) |
| Needs | Web: `GET /threads/{id}`, `POST /threads/{id}/replies`. No server: `store.threads.get/reply` (one device only). Blocks: Channels, Reactions, Mentions, Presence, Notifications |
| Used in | AppChat, AppForum, AppCode |

## Markup

```html
<!-- under a message in the channel: the thread summary -->
<button class="btn h-auto gap-2 px-2 py-1" data-variant="ghost" type="button" aria-controls="thread" aria-expanded="true">
  <span class="avatar-group"><span class="avatar" data-size="sm"><span class="bg-muted">KA</span></span><span class="avatar" data-size="sm"><span class="bg-muted">KM</span></span></span>
  <span class="text-sm font-medium text-primary underline-offset-4 hover:underline" data-t="thread.replies">4 replies</span>
  <span class="text-muted-foreground text-xs" data-t="thread.last">Last reply 10:32</span>
</button>

<!-- the thread panel -->
<aside id="thread" class="flex h-full flex-col border-l bg-background @3xl:w-96" aria-labelledby="thread-title">
  <header class="flex items-center justify-between gap-2 border-b px-4 py-3">
    <div><h2 id="thread-title" class="font-semibold" data-t="thread.title">Thread</h2><p class="text-muted-foreground text-xs">#field-trip</p></div>
    <button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="Close thread" data-t-label="thread.close">✕</button>
  </header>
  <ol class="flex-1 overflow-y-auto px-4 py-3 grid content-start gap-4" aria-label="Replies">
    <li class="grid grid-cols-[auto_1fr] gap-x-3">
      <span class="avatar"><span class="bg-muted">RS</span></span>
      <div><p class="text-sm"><b>Ren Sato</b> <time class="text-muted-foreground text-xs" datetime="2026-10-18T10:04">10:04</time></p><p>Who can bring the class banner?</p></div>
    </li>
    <li role="separator" class="text-muted-foreground flex items-center gap-2 text-xs"><hr class="flex-1"><span data-t="thread.count">4 replies</span><hr class="flex-1"></li>
    <li class="grid grid-cols-[auto_1fr] gap-x-3">
      <span class="avatar"><span class="bg-muted">KA</span></span>
      <div><p class="text-sm"><b>Kana Abe</b> <time class="text-muted-foreground text-xs">10:12</time></p><p>I can, it’s in the art room.</p></div>
    </li>
  </ol>
  <form class="grid gap-2 border-t p-3" hx-post="/threads/m_88/replies">
    <label class="sr-only" for="reply" data-t="thread.reply_label">Reply</label>
    <textarea id="reply" name="text" class="textarea min-h-16" rows="2" placeholder="Reply…" data-t-placeholder="thread.placeholder"></textarea>
    <div class="flex items-center justify-between gap-2">
      <label class="label gap-2 text-sm font-normal"><input class="input" type="checkbox" name="also_channel"><span data-t="thread.also_send">Also send to #field-trip</span></label>
      <button class="btn" data-size="sm" type="submit" data-t="thread.send">Reply</button>
    </div>
  </form>
</aside>
```

## States

| State | What changes |
| --- | --- |
| No replies | Summary hidden; the message's hover actions show Reply in Thread. The panel shows the first message and `thread.first`. |
| Loading | The first message (already known) and three `skeleton` reply rows. |
| New replies while open | They appear at the bottom; if you scrolled up, a `btn` `thread.new` (“2 new replies”) at the bottom jumps down. |
| Unread | In the channel the summary reads `thread.unread` in `font-semibold`; a Threads entry in the side panel lists them. |
| Sending | The reply shows at once, `opacity-60`, with `thread.sending`; failed: `text-destructive` `thread.failed` and Retry / Delete. |
| First message deleted | Its row reads `thread.deleted`; replies stay. |
| Following | A `btn` Follow / Following (`aria-pressed`) in the header: following notifies on every reply. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `thread.title` | Thread | スレッド |
| `thread.replies` | {count} replies | {count} 件の返信 |
| `thread.last` | Last reply {time} | 最終返信 {time} |
| `thread.count` | {count} replies | {count} 件の返信 |
| `thread.reply_label` | Reply | 返信 |
| `thread.placeholder` | Reply… | 返信を入力… |
| `thread.also_send` | Also send to #{channel} | #{channel} にも送信 |
| `thread.send` | Reply | 返信 |
| `thread.close` | Close thread | スレッドを閉じる |
| `thread.first` | No replies yet. Start the thread. | まだ返信はありません。最初の返信をしましょう。 |
| `thread.new` | {count} new replies | 新しい返信 {count} 件 |
| `thread.unread` | {count} new replies | 新しい返信 {count} 件 |
| `thread.sending` | Sending… | 送信中… |
| `thread.failed` | Not sent. | 送信できませんでした。 |
| `thread.retry` | Retry | 再送信 |
| `thread.deleted` | This message was deleted. | このメッセージは削除されました。 |
| `thread.follow` | Follow | フォロー |
| `thread.following` | Following | フォロー中 |
| `thread.reply_in` | Reply in Thread | スレッドで返信 |

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
