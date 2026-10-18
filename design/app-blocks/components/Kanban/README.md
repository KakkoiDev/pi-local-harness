# Kanban

A board of columns (To Do, Doing, Done) holding cards that the person drags between columns, or moves with a menu and the keyboard.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `card`, `badge`, `btn`, `avatar`, `dropdown-menu`, `empty` |
| Route | `/board` (one board) or `/boards/{id}` |
| Needs | Web: `GET /board`, `POST /cards`, `PATCH /cards/{id}` (`column`, `position`). No server: `store.cards()`, `store.moveCard(id, column, position)`, `store.addCard(card)`. |
| Links to | DragList (the drag rules), EditForm (card detail), LabelsAssignees, AvatarGroup, AppBoard, Presence, WipLimit (column limits) |

## Markup

```html
<main class="app grid min-h-0 gap-4 p-4 @3xl:p-8">
  <header class="flex items-center justify-between gap-4">
    <h1 class="text-xl font-semibold @3xl:text-2xl" data-t="board.title">Class project</h1>
    <button class="btn" type="button" data-t="board.add_card">Add Card</button>
  </header>
  <p id="board-live" class="sr-only" aria-live="polite"></p>
  <div class="flex snap-x gap-4 overflow-x-auto pb-2 @3xl:grid @3xl:grid-cols-3 @3xl:overflow-visible">
    <section class="grid w-[85%] shrink-0 snap-start content-start gap-3 rounded-lg bg-muted/50 p-3 @3xl:w-auto" aria-labelledby="col-todo" data-column="todo">
      <header class="flex items-center justify-between">
        <h2 id="col-todo" class="text-sm font-semibold"><span data-t="board.col.todo">To Do</span> <span class="badge" data-variant="secondary">3</span></h2>
        <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Add a card to To Do" data-t-label="board.add_to">+</button>
      </header>
      <ol class="grid gap-2" role="list">
        <li>
          <article class="card gap-2 p-3" draggable="true" tabindex="0" data-card="17" aria-describedby="board-help">
            <h3 class="text-sm font-medium">Interview three classmates</h3>
            <div class="flex items-center justify-between gap-2">
              <span class="badge" data-variant="outline">Research</span>
              <span class="avatar" data-size="sm"><span>AK</span></span>
            </div>
            <div class="dropdown-menu">
              <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Move or edit “Interview three classmates”" data-t-label="board.card_menu">⋯</button>
              <div data-popover aria-hidden="true"><div role="menu">
                <button role="menuitem" data-t="board.move_to_doing">Move to Doing</button>
                <button role="menuitem" data-t="board.move_to_done">Move to Done</button>
                <hr role="separator">
                <button role="menuitem" data-t="board.edit">Edit…</button>
              </div></div>
            </div>
          </article>
        </li>
      </ol>
    </section>
    <!-- Doing (data-column="doing"), Done (data-column="done") the same way -->
  </div>
  <p id="board-help" class="sr-only" data-t="board.help">Space to pick up, arrow keys to move, Space to drop, Esc to cancel.</p>
</main>
```

## States

| State | What changes |
| --- | --- |
| Board (default) | Columns in order; each card shows title, label and assignee; the count badge per column (with a limit, the badge and its rules come from **WipLimit**). |
| Dragging | The dragged card gets `aria-grabbed="true"` and `opacity-50`; the drop place shows a 2 px `bg-primary` line between cards. The column under the pointer gets `ring-2 ring-ring`. |
| Picked up with the keyboard | Same look; `#board-live` says `board.live.picked`. Arrow keys move the placeholder; Space drops (`board.live.dropped`), Esc puts it back (`board.live.cancelled`). |
| Saving a move | The card moves at once; if the save fails it goes back and a toast says `board.error.move` with **Try Again**. |
| Empty column | `<p class="text-muted-foreground text-sm" data-t="board.col.empty">No cards</p>` inside the list, still a drop target. |
| Empty board | EmptyState: `board.empty.title`, `board.empty.body`, **Add Card**. |
| Loading | Three columns with two `skeleton h-20` cards each. |
| Column limit (optional) | When a column has a limit, use the **WipLimit** block for the count: the badge reads `3 / 4`; over the limit it uses `data-variant="destructive"` (still allowed). WipLimit's card has the texts, the warning and how the limit is set. |
| Someone else moved a card | With Presence on: the card moves and flashes `ring-2` for 1 s; `#board-live` says `board.live.moved_by`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `board.title` | Class project | クラスのプロジェクト |
| `board.add_card` | Add Card | カードを追加 |
| `board.col.todo` | To Do | 未着手 |
| `board.col.doing` | Doing | 進行中 |
| `board.col.done` | Done | 完了 |
| `board.col.empty` | No cards | カードはありません |
| `board.add_to` | Add a card to {column} | {column} にカードを追加 |
| `board.card_menu` | Move or edit “{title}” | 「{title}」を移動・編集 |
| `board.move_to_todo` | Move to To Do | 未着手へ移動 |
| `board.move_to_doing` | Move to Doing | 進行中へ移動 |
| `board.move_to_done` | Move to Done | 完了へ移動 |
| `board.edit` | Edit… | 編集… |
| `board.help` | Space to pick up, arrow keys to move, Space to drop, Esc to cancel. | スペースで持ち上げ、矢印キーで移動、スペースで置きます。Esc で取り消します。 |
| `board.live.picked` | Picked up “{title}”. | 「{title}」を持ち上げました。 |
| `board.live.dropped` | “{title}” moved to {column}, position {position}. | 「{title}」を {column} の {position} 番目に移動しました。 |
| `board.live.cancelled` | Move cancelled. | 移動を取り消しました。 |
| `board.live.moved_by` | {name} moved “{title}” to {column}. | {name} さんが「{title}」を {column} に移動しました。 |
| `board.error.move` | The card couldn’t be moved. It’s back where it was. | カードを移動できませんでした。元の場所に戻しました。 |
| `board.empty.title` | No cards yet | まだカードがありません |
| `board.empty.body` | Add a card for each thing to do. | やることごとにカードを追加しましょう。 |

## Keyboard and focus

1. Add Card → 2. per column: its + button, then each card (Tab), then each card's ⋯ menu.
- On a card: Space picks it up; ← → move to the previous/next column, ↑ ↓ within the column; Space drops; Esc cancels. Return opens the card (Edit).
- After a move by menu or keyboard, focus stays on the moved card in its new place.

## Phone

- Columns become a horizontal scroller, one column at 85% width with the next peeking (`snap-x`); the column headers stay visible.
- Dragging is a long press (500 ms) then drag; the ⋯ menu's **Move to …** items are the always-available way (no drag needed).
- The ⋯ button is 44 px (App foundations).

## Data

```json
{"columns": [{"id": "todo", "title_key": "board.col.todo", "limit": null},
             {"id": "doing", "title_key": "board.col.doing", "limit": 4},
             {"id": "done", "title_key": "board.col.done", "limit": null}],
 "cards": [{"id": 17, "title": "Interview three classmates", "column": "todo", "position": 0,
            "label": "Research", "assignee": {"id": 3, "name": "Aiko Kato", "initials": "AK"}}]}
```

- Web: `PATCH /cards/17` with `column=doing&position=1` → 200 with the updated card fragment, or 409 if the board changed (reload the column).
- No server: `store.moveCard(17, 'doing', 1)` renumbers positions in both columns.
- Positions are whole numbers per column, starting at 0.

## Don't

- Don't make drag the only way to move a card.
- Don't add swimlanes, due-date colours or WIP rules unless asked; a column limit is WipLimit, nothing else.
- Don't use `position: fixed` for the dragged card; use the HTML drag image or a transform.
