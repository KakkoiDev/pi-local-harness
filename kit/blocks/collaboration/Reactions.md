# Reactions

App Block card (Collaboration). A row of small emoji counters under a message or comment, plus a button to add one; pressing a counter adds or removes your reaction.

- Basecoat: `btn` (toggle buttons with `aria-pressed`), `popover`, `tooltip` (`data-tooltip`)
- Route: none (under a message)
- Needs: Web: `POST /messages/{id}/reactions` `{emoji}` toggles, returns the row fragment. No server: `store.reactions.toggle(messageId, emoji)`. Blocks: Threads, Channels, Comments, IssueDetail
- Used in: AppChat, AppForum, AppCode, AppNotes

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/Reactions.html` (24 lines of HTML).

Your own reactions are `data-variant="secondary"` with `aria-pressed="true"` and a bold count; others are `outline`. The six quick emoji are fixed; a full picker is a separate block when an app needs one.

## States
- None yet: Only the add button, shown on hover/focus of the message (always on phone).
- Toggling: The count changes at once (optimistic); on failure it goes back and a toast `react.failed` appears.
- Many kinds: Up to 8 counters in a row; more wrap.
- Big counts: `1.2k` style above 999 (`Intl.NumberFormat` compact), full number in the tooltip.
- Who reacted: Tooltip lists up to 10 names then `react.and_more`.
- Read only (archived): Counters are plain `span`s, no add button.

## Texts
(Key | English | 日本語)
- `react.label`: Reactions | リアクション
- `react.add`: Add a reaction | リアクションを追加
- `react.choose`: Choose a reaction | リアクションを選択
- `react.count_mine`: {emoji} {count} reactions, including yours. Remove yours | {emoji} {count} 件（自分を含む）。自分のリアクションを取り消す
- `react.count`: {emoji} {count} reactions. Add yours | {emoji} {count} 件。リアクションする
- `react.you`: You | あなた
- `react.and_more`: and {count} more | ほか {count} 人
- `react.failed`: Couldn’t save your reaction. Try again. | リアクションを保存できませんでした。もう一度お試しください。
- `react.thumbs_up`: Thumbs up | いいね
- `react.heart`: Heart | ハート
- `react.laugh`: Laughing | 笑顔
- `react.party`: Party | お祝い
- `react.eyes`: Eyes | 見ています
- `react.check`: Check | 確認済み

## Keyboard and focus
1. Each counter in order → 2. Add a reaction.
- Space or Return toggles a counter. In the picker: arrows move across the grid, Return chooses, Esc closes and returns focus to the add button.
- After choosing, focus goes to the counter for that emoji.

## Phone
- Counters are 44 px tall touch targets (`@max-3xl:h-11 @max-3xl:px-3`).
- Long-pressing a message opens the quick six as a row at the top of its action sheet; the add button stays for people who don't long-press.
- “Who reacted” opens in a sheet on tap-and-hold of a counter instead of a tooltip.

## Data
```json
{"message": "m_88", "reactions": [{"emoji": "👍", "count": 3, "mine": true, "people": ["You", "Ren Sato", "Kana Abe"]},
                                  {"emoji": "🎉", "count": 1, "mine": false, "people": ["Kaito Mori"]}]}
```

- Web: `POST /messages/m_88/reactions` with `emoji=👍` → 200 and the new row fragment; the change reaches others through the live channel (Presence).
- No server: `store.reactions.toggle("m_88", "👍")` returns the new list.

## Don't
- Don't use colour alone for “mine”: keep `aria-pressed` and the bold count.
- Don't let a counter reach 0 on screen; remove it.
- Don't load an emoji font or image set; use the system's emoji.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Reactions` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
