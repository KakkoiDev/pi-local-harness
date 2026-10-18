# Mentions

Typing @ in a message, comment or page opens a list of people (and pages with [[) to mention; the mention becomes a chip and notifies the person.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `popover`, `avatar`, `badge`, `kbd` |
| Route | none (inside a text field) |
| Needs | Web: `GET /people/search?q=` (fragment of options). No server: `store.people.search(q)` (local people only; mentioning notifies nobody without a server). Blocks: Notifications, Comments, Threads, BlockEditor |
| Used in | AppChat, AppNotes, AppCode, AppForum |

## Markup

```html
<div class="popover relative grid">
  <div id="msg-input" class="textarea min-h-20" contenteditable="true" role="textbox" aria-multiline="true"
       aria-label="Message" aria-autocomplete="list" aria-controls="mention-list" aria-expanded="true" aria-activedescendant="mention-p2">
    Can <span class="badge" data-variant="secondary" data-mention="u_12" contenteditable="false">@Ren Sato</span> bring the map? @ka
  </div>
  <div id="mention-popover" data-popover aria-hidden="false" class="w-72 min-w-0 p-1">
    <p class="text-muted-foreground px-2 py-1 text-xs" data-t="mention.people">People</p>
    <ul id="mention-list" role="listbox" aria-label="People to mention" data-t-label="mention.list_label" class="grid">
      <li id="mention-p1" role="option" aria-selected="false" class="flex items-center gap-2 rounded-sm px-2 py-1.5">
        <span class="avatar" data-size="sm"><span class="bg-muted">KM</span></span>
        <span class="flex-1 truncate">Kaito Mori</span><span class="text-muted-foreground text-xs">kaito</span>
      </li>
      <li id="mention-p2" role="option" aria-selected="true" class="flex items-center gap-2 rounded-sm bg-accent px-2 py-1.5">
        <span class="avatar" data-size="sm"><span class="bg-muted">KA</span></span>
        <span class="flex-1 truncate">Kana Abe</span><span class="text-muted-foreground text-xs">kana</span>
      </li>
    </ul>
    <p class="text-muted-foreground border-t px-2 py-1 text-xs" data-t="mention.hint">↑↓ to choose · Return to mention · Esc to close</p>
  </div>
</div>
```

In the sent text the chip is stored as a token `<@u_12>` and drawn as `<a class="badge" data-variant="secondary" href="/people/u_12">@Ren Sato</a>`. Mentioning yourself is drawn with `data-variant="primary"`.

## States

| State | What changes |
| --- | --- |
| Just typed @ | The list shows the 5 people most recently talked to in this place. |
| Filtering | Matches by name and handle, Japanese reading too (`かな` finds Kana Abe); the matched part is `font-semibold`. |
| Searching (web) | A `skeleton` row while the request runs (after 150 ms). |
| No match | One line `mention.none`; Return then types a plain “@text”. |
| Not in this channel | The person shows with `mention.not_member`; choosing them asks with InlineAlert: `mention.invite_q` (Invite · Mention Anyway). |
| Group mentions | `@here` and `@everyone` at the end of the list with `mention.notifies` count; only shown to roles allowed (Roles). |
| Pages | Typing `[[` lists pages instead (`mention.pages`); the chip links to `/pages/{id}`. |
| Removed person | The chip shows `mention.removed` (`badge data-variant="outline"`, not a link). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `mention.people` | People | メンバー |
| `mention.pages` | Pages | ページ |
| `mention.hint` | ↑↓ to choose · Return to mention · Esc to close | ↑↓で選択・Returnでメンション・Escで閉じる |
| `mention.none` | No one called “{query}” | 「{query}」に一致するメンバーはいません |
| `mention.not_member` | Not in this channel | このチャンネルにいません |
| `mention.invite_q` | {name} isn’t in this channel, so they won’t see the message. | {name} さんはこのチャンネルにいないため、メッセージは表示されません。 |
| `mention.invite` | Invite to Channel | チャンネルに招待 |
| `mention.anyway` | Mention Anyway | このままメンション |
| `mention.notifies` | Notifies {count} people | {count} 人に通知されます |
| `mention.removed` | Removed user | 削除されたユーザー |
| `mention.list_label` | People to mention | メンションする相手 |

## Keyboard and focus

- Focus stays in the text field the whole time (`aria-activedescendant` points at the highlighted option).
- ↑ ↓ move, Return or Tab inserts the mention and a space, Esc closes the list and keeps the typed text, typing a space with no match closes it.
- Backspace right after a chip selects it first; a second Backspace removes it.

## Phone

- The list opens above the keyboard as a strip the width of the field, 44 px rows, at most 4 rows visible, scrolling.
- An @ button in the composer toolbar types @ for people who don't know it.

## Data

```json
{"query": "ka", "results": [{"id": "u_31", "name": "Kana Abe", "handle": "kana", "reading": "あべ かな", "avatar": null, "member": true}],
 "message": {"text": "Can <@u_12> bring the map?", "mentions": ["u_12"]}}
```

- Web: `GET /people/search?q=ka&place=ch_4` → `<li role="option">` fragment; sending stores `mentions` and creates a Notification for each.
- No server: `store.people.search(q)` over the local people list; no notifications are sent.

## Don't

- Don't store the display name inside the text; store the id token and draw the current name.
- Don't move focus into the list.
- Don't notify people who can't see the place.
