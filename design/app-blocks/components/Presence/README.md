# Presence

Who else is here right now, live: the avatars of people on the same page, what they are looking at or typing, and the connection state, for multiplayer apps.

| | |
| --- | --- |
| Group | Sharing and people |
| Basecoat | `avatar`, `avatar-group`, `badge`, `popover`, `tooltip` (`data-tooltip`), `alert` |
| Route | none: it sits in TopBar (the stack) and inside editors and chats (typing line, cursors) |
| Needs | Capability “Multiplayer, real time”. Web: a WebSocket `/ws/projects/{id}` (htmx `hx-ws` extension, or plain `WebSocket`). No server: p2p-core rooms (`kit/vendor/p2p-core-0.1.0`, `extras/presence.js`) between tabs or paired devices. Needs a name per person (Log in and accounts, or a name asked once). |
| Links to | TopBar, AvatarGroup, DocEditor, BlockEditor, Kanban, Channels / Threads (typing), OfflineBanner, ActivityFeed |

## Markup

```html
<!-- In TopBar: who is here -->
<div class="popover" id="presence">
  <button class="btn" data-variant="ghost" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="presence-popover" aria-label="3 people here: Ren Sato, Mina Takahashi and you">
    <span class="avatar-group">
      <span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-1)"><span>RS</span></span>
      <span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-3)"><span>MT</span></span>
      <span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-2)"><span>AK</span></span>
    </span>
  </button>
  <div data-popover id="presence-popover" aria-hidden="true" class="w-64">
    <h3 class="text-sm font-medium" data-t="presence.here">Here now</h3>
    <ul class="mt-2 grid gap-2 text-sm">
      <li class="flex items-center gap-2">
        <span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-1)"><span>RS</span></span>
        <span class="flex-1">Ren Sato</span>
        <span class="text-muted-foreground text-xs" data-t="presence.editing">Editing</span>
      </li>
      <li class="flex items-center gap-2">
        <span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-3)"><span>MT</span></span>
        <span class="flex-1">Mina Takahashi</span>
        <span class="text-muted-foreground text-xs" data-t="presence.viewing">Viewing</span>
      </li>
      <li class="flex items-center gap-2">
        <span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-2)"><span>AK</span></span>
        <span class="flex-1">Aiko Kato <span class="text-muted-foreground" data-t="invite.you">(you)</span></span>
      </li>
    </ul>
    <p class="text-muted-foreground mt-3 flex items-center gap-1 text-xs" role="status"><span class="size-2 rounded-full bg-[var(--chart-3)]" aria-hidden="true"></span><span data-t="presence.live">Live</span></p>
  </div>
</div>

<!-- Under a chat or editor: who is typing -->
<p id="typing" class="text-muted-foreground h-5 text-xs" aria-live="polite" data-t="presence.typing_one">Ren is typing…</p>

<!-- Inside a document: where someone is (a label on their cursor or selected block) -->
<span class="pointer-events-none absolute -top-5 left-0 rounded border-2 bg-background px-1.5 text-xs" style="border-color: var(--chart-1)" aria-hidden="true">Ren</span>
```

Each person gets one series colour for the session (`--chart-1` … `--chart-5`, in join order, then repeating) so their avatar ring, cursor label border and block border match. Text stays in the theme's foreground colour (series colours are not text colours). The colour is never the only sign: the name is always shown with it.

## States

| State | What changes |
| --- | --- |
| Others here (default) | Up to 3 avatars, then `+N` (`<span data-count>+2</span>` in the group); the button's `aria-label` lists names. |
| Alone | The stack shows only you, dimmed (`opacity-60`); popover says `presence.alone`. Many apps hide the stack entirely when alone: do that if the page has no sharing. |
| Someone joins / leaves | Their avatar fades in/out (150 ms; none with reduced motion); a polite announcement `presence.joined` / `presence.left`, at most one per 10 s. |
| Idle | After 5 minutes without input their avatar gets `opacity-50` and the popover says `presence.away`. |
| Typing | `#typing` shows `presence.typing_one`, `presence.typing_two` or `presence.typing_many`; cleared 4 s after their last key. |
| Editing the same thing | In DocEditor / BlockEditor the block they are in gets a 2 px left border in their colour and the cursor label. |
| Connecting | The status dot is `bg-muted-foreground` and `presence.connecting`; avatars of others are hidden. |
| Disconnected | `presence.offline` in the popover status; OfflineBanner shows at the top; the app keeps working on its own copy and syncs when back. |
| Reconnected | `presence.back` once; everyone's positions refresh. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `presence.button` | {count} people here: {names} | {count} 人が参加中：{names} |
| `presence.here` | Here now | 参加中 |
| `presence.editing` | Editing | 編集中 |
| `presence.viewing` | Viewing | 閲覧中 |
| `presence.away` | Away | 離席中 |
| `presence.alone` | Only you are here. | 参加しているのはあなただけです。 |
| `presence.live` | Live | 接続中 |
| `presence.connecting` | Connecting… | 接続しています… |
| `presence.offline` | Offline: your changes are saved and will sync. | オフライン：変更は保存され、あとで同期されます。 |
| `presence.back` | Back online. | オンラインに戻りました。 |
| `presence.joined` | {name} joined. | {name} さんが参加しました。 |
| `presence.left` | {name} left. | {name} さんが退出しました。 |
| `presence.typing_one` | {name} is typing… | {name} さんが入力中… |
| `presence.typing_two` | {a} and {b} are typing… | {a} さんと {b} さんが入力中… |
| `presence.typing_many` | Several people are typing… | 複数の人が入力中… |
| `presence.more` | {count} more | ほか {count} 人 |

## Keyboard and focus

1. The stack is one button in TopBar; Return/Space opens the popover; Esc closes it and returns focus.
- In the popover, names are text (not focusable) unless the app has profiles, then each is a link.
- Cursor labels and the typing line are not focusable; the typing line is a polite live region.

## Phone

- The stack shows at most 2 avatars + `+N` in TopBar; tapping opens the list as a bottom sheet (a `dialog` with `@max-3xl:` bottom placement) instead of a popover.
- Cursor labels are hidden on the phone; the block border in the person's colour stays.

## Data

```json
{"type": "presence", "room": "project:12/notes:42",
 "people": [{"id": "u5", "name": "Ren Sato", "initials": "RS", "colour": 1, "state": "editing", "where": {"block": "b-7"}, "typing": true, "last_seen": "2026-10-18T10:02:11+09:00"},
            {"id": "u8", "name": "Mina Takahashi", "initials": "MT", "colour": 3, "state": "viewing", "typing": false}]}
```

- Web: each client sends `{"type":"here","where":…,"typing":true}` on change (throttled to 4 per second) and a heartbeat every 15 s; the server broadcasts the room's list; a person not heard from for 30 s is removed.
- No server: p2p-core's presence extra does the same over the room; positions are sent, not stored.
- Presence is never saved; ActivityFeed records changes, not who looked.

## Don't

- Don't use red or green as someone's colour meaning anything; colours only tell people apart.
- Don't show other people's cursors without their names.
- Don't announce every keystroke or every join to screen readers.
