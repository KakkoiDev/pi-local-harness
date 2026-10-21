# DraftVersions

**Existing vs Proposed.** Existing: one unsent draft per composer, kept only in the open window. Decided (round 19, A3, owner-delegated 21 Oct 2026; design only, not implemented): drafts are kept on the harness host per person and conversation, shared by every authorized device and window. Saves carry a revision; a save against an older revision becomes a new **version** instead of overwriting. When there is more than one version, this card lists them above the composer. Shared by the dashboard Ask pane (worker B) and project chat (worker C reuses this markup by name; keep the classes stable).

Boards: R19_AskDrafts, Ph19_AskDrafts, Ph19_AskOffline, R19_AskTrash (draft version in the Trash), R19_AskStrings, R19_AskWalk. CSS: `scripts/round19_b.css` (`.pw-draftv*`). Supersedes the round 18 addendum's Q3 notice (“This draft was also changed in another window…”, Use This Version / Use Other Version / Show Both, “Other version kept · Discard Other Version…”).

## Anatomy

- `section.pw-draftv[role=group][aria-labelledby]` placed first in the composer form (above the read-only line and the field).
- Head `.pw-draftv__head`: `h4.pw-draftv__h` “Draft versions · 3” + a **Hide** / **Show** button (`aria-expanded`, `aria-controls` the list).
- Hint `p.pw-draftv__hint`: “Use a version to edit and send it. The others stay until you discard them.”
- List `ol.pw-draftv__list` (scrolls past 240 px) of `li.pw-draftv__row[data-state]`:
  - `p.pw-draftv__meta`: **device or window** · “saved 14:52” · `span.pw-draftv__state` (Saved · Saving… · Unsaved · Not saved · Conflict);
  - `p.pw-draftv__text`: the version's text, two lines at most (the person's own words);
  - `.pw-draftv__actions`: **Use This Version** and **Discard…** — or, on the version in the field, the label “In use” (`aria-current="true"`, a 3 px rule) and no buttons.
- Offline line `p.pw-draftv__offline[role=status]`: “You're offline. Your typing is kept here as Unsaved and will be offered as a version when you reconnect.”
- Discard confirmation: an alert “Discard this draft version?” / “It moves to the Trash. You can restore it from the Trash.” / **Cancel** (default) · **Discard**; then a toast “Draft version moved to the Trash.” + **Undo**.

## States

| State | What shows |
| --- | --- |
| Idle (one version, Saved) | No list. The field holds the draft. With one version that isn't Saved (Saving…, Unsaved, Not saved) the list shows that one row so its state is visible. |
| Loading | “Draft versions · …” head only, the list replaced by nothing until loaded; the field stays usable. |
| Empty | Not applicable — with no versions the card is not shown. |
| Saving | The in-use row reads “Saving…” (dotted badge); “Saved” when the host confirms. |
| Error (save failed while online) | The in-use row reads “Not saved” with **Retry**; the text stays in the field (follow-up decision 2). |
| Disabled | Use This Version is not offered on the in-use row; Discard… is not offered on it either (use another version first). |
| Stale | Another device saved: the list updates in place, focus is not moved, one polite announcement “Draft versions · 3”. |
| Conflict | Two or more versions with “Conflict”; any number allowed. Nothing merges or expires. |
| Offline | The offline line; typing continues; the in-use row reads “Unsaved”, and the help line sits under the draft. Nothing goes to browser persistent storage. On reconnect the Unsaved text is saved as a new version. |

## Rules

- Who: the signed-in person, on any of their authorized devices/windows. Never another person.
- Persistence: harness host, per person and conversation; no browser persistent storage (Unsaved typing lives only in the open window).
- Use This Version: puts that version in the field; the version that was there stays in the list. Never sends.
- Send: sends the field's text; that version leaves the list; the others stay.
- Discard…: confirm, then the version moves to the Trash (ConversationTrash) with Undo; Restore returns it to the list, never into the field.
- Prefill (Ask About, Ask in Overview) never overwrites: the round 18 notice “This conversation already has an unsent draft.” still applies.
- A queued send refused at dispatch returns its question to the draft; if the field holds text, it becomes another version.

## Texts (EN / JA)

| English | 日本語 |
| --- | --- |
| Draft versions · {n} | 下書きの版 · {n} |
| Use a version to edit and send it. The others stay until you discard them. | 版を選ぶと編集して送信できます。ほかの版は破棄するまで残ります。 |
| This window / Mac · window 2 / iPhone / This phone | このウインドウ / Mac · ウインドウ 2 / iPhone / この電話 |
| saved {time} | {time} に保存 |
| Saved · Saving… · Unsaved · Not saved · Conflict | 保存済み · 保存中… · 未保存 · 保存されていません · 競合 |
| In use | 使用中 |
| Use This Version | この版を使う |
| Discard… | 破棄… |
| Show · Hide | 表示 · 隠す |
| You're offline. Your typing is kept here as Unsaved and will be offered as a version when you reconnect. | オフラインです。入力は未保存としてここに残り、再接続すると版として表示されます。 |
| Discard this draft version? / It moves to the Trash. You can restore it from the Trash. / Cancel · Discard | この下書きの版を破棄しますか？ / ゴミ箱に移動します。ゴミ箱から元に戻せます。 / キャンセル · 破棄 |
| Draft version moved to the Trash. · Undo | 下書きの版をゴミ箱に移動しました。 · 取り消す |

## Data (implementation dependencies)

```json
{"conversation_id": "ov-12", "person_id": "p_1", "revision": 7,
 "versions": [{"id": "dv_3", "source": {"kind": "window", "label": "Mac · window 2"}, "text": "…", "saved_at": "2026-10-21T14:52:00", "base_revision": 5, "state": "conflict"}]}
```

Revision-checked save endpoint (a stale base revision creates a version); a push of version changes to open windows; Trash entries for discarded versions; no expiry.

## Focus, keyboard, live

Tab order: Hide/Show → each row's buttons → the field. Use This Version moves focus to the field (caret at end). Discard… opens the alert (focus on Cancel); after Discard or Cancel focus returns to the row's next control (or the field). Escape in the alert = Cancel. No per-keystroke or per-save announcements; one polite announcement when the number of versions changes.

## Phone

Same list above the composer; 44 px buttons; 15–16 px text; the list scrolls inside its box. Long device names wrap.

## Inverse

Tokens only; the in-use rule and badges use `currentColor`.

## Don't

- Don't merge, auto-pick or expire versions; don't last-write-wins.
- Don't save raw drafts to localStorage/IndexedDB as a fallback.
- Don't send on Use This Version, and don't put a restored version into the field.

## Walkthrough (Given / When / Then)

1. Given this window, Mac window 2 and the iPhone saved different drafts. When I focus “Question”. Then “Draft versions · 3” lists all three with save times and “Conflict”; mine is “In use”.
2. Given I'm offline. When I type. Then the offline line shows and my row reads “Unsaved”; on reconnect it becomes a version.
3. Given three versions. When I press “Discard iPhone version…” and “Discard”. Then it moves to the Trash and “Draft version moved to the Trash.” offers “Undo”.
4. Given three versions. When I press “Send”. Then my text is sent and “Draft versions · 2” remains.

### Follow-up decisions (21 Oct)

Decision record: design/briefs/round-19-follow-up-decisions.md (1, 2, 3, 12). Boards: R19_AskUnsaved, R19_AskRemote, Ph19_AskOffline, Ph19_AskRemote. New classes (additive): `p.pw-draftv__help`, `li.pw-draftv__row[data-state="failed"]`, `.pw-draftv--ro`.

- **Unsaved (1).** State word “Unsaved” (未保存). While Unsaved text exists: the help line `p.pw-draftv__help#dv-help` under the draft (the field's `aria-describedby` includes it) — “Unsaved text stays in this window. If the browser or phone closes the page, it can be lost.” (未保存の文字はこのウインドウに残ります。ブラウザーや電話がページを閉じると失われることがあります。) — and the browser's own leave-page warning is registered (no custom copy; best effort; no promise against crashes, killed tabs or phone eviction). Persisted to the host whenever reachable; never to browser persistent storage. In-app navigation keeps the text in this window's memory; a failed or cancelled navigation never clears it.
- **Online save failure (2).** “Not saved” (保存されていません) + **Retry** (再試行) on the in-use row; the buffer is kept; Retry is revision-checked. Only one save is in flight (“Saving…”); no second simultaneous save. An acknowledgement for an older revision never marks newer text “Saved” (it stays “Saving…”, or “Unsaved” offline). Newer remote data → both kept as “Conflict” versions; neither overwritten.
- **Deleted in another window (3).** The composer is replaced by ConversationTrash's read-only detail; unsaved text is stored as a draft version with the trashed conversation (shown read only, `.pw-draftv--ro`, no actions); late or retried saves are never sent.
- **Theme (12).** Dark and light wrappers render selection from the wrapper's own ink/paper (round19_theme.css); preview shows both.
- Who: the signed-in person. Persistence: host. Cancellation: Retry can be pressed again; nothing is discarded implicitly. Focus: stays in the field; Retry is reached by Tab from the list.
- States add: Not saved (error) as above; the single-version rule above.

Given/When/Then: (1) Given Unsaved text, When I close the tab, Then the browser's own warning appears (best effort). (2) Given revision 6 saving, When I type and revision 6 is acknowledged, Then my row stays “Saving…”. (3) Given a failed save, When I press “Retry” and a newer version exists, Then both are “Conflict”. (4) Given unsaved text, When another window deletes the conversation, Then my text is kept as a draft version with it.
