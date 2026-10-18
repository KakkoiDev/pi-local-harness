# IssueDetail

One issue: its title and state, the description, the conversation and events in time order, a reply box with Close Issue, and a side column for assignees, labels and links.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `badge`, `btn`, `button-group`, `avatar`, `textarea`, `card` |
| Route | `/r/{repo}/issues/{number}` |
| Needs | Web: `GET /r/{repo}/issues/{n}`, `POST …/comments`, `PATCH /r/{repo}/issues/{n}` (title, state, labels, assignees). No server: `store.issues.get/update/comment`. Blocks: Comments, Reactions, Mentions, LabelsAssignees, Timeline, ConfirmDialog |
| Used in | AppCode, AppBoard, AppCrm |

## Markup

```html
<article class="grid gap-6 @3xl:grid-cols-[1fr_16rem]" aria-labelledby="issue-title">
  <header class="grid gap-2 @3xl:col-span-2">
    <h1 id="issue-title" class="text-2xl font-semibold">Timetable page shows Saturday twice <span class="text-muted-foreground font-normal">#42</span></h1>
    <p class="flex flex-wrap items-center gap-2 text-sm">
      <span class="badge bg-green-700 text-white dark:bg-green-600" data-t="issue.open">Open</span>
      <span class="text-muted-foreground" data-t="issue.opened">Kana Abe opened this 2 days ago · 3 comments</span>
      <button class="btn ml-auto" data-variant="outline" data-size="sm" type="button" data-t="issue.edit_title">Edit Title</button>
    </p>
  </header>
  <ol class="grid content-start gap-4" aria-label="Conversation">
    <li class="card gap-2 py-4">
      <header class="flex items-center gap-2 text-sm"><span class="avatar" data-size="sm"><span class="bg-muted">KA</span></span><b>Kana Abe</b><time class="text-muted-foreground" datetime="2026-10-16T14:20">16 Oct, 14:20</time><span class="badge ml-auto" data-variant="outline" data-t="issue.author">Author</span></header>
      <section class="grid gap-2"><p>On the timetable page, Saturday appears twice in the week view. It started after the term dates changed.</p></section>
    </li>
    <li class="text-muted-foreground flex items-center gap-2 pl-4 text-sm"><span aria-hidden="true">🏷</span><span><b class="text-foreground">Ren Sato</b> added <span class="badge" data-variant="destructive">bug</span> yesterday</span></li>
  </ol>
  <aside class="grid content-start gap-4 text-sm" aria-label="Details">
    <section class="grid gap-1 border-b pb-3"><h2 class="text-muted-foreground text-xs font-medium" data-t="issue.assignees">Assignees</h2><p class="flex items-center gap-2"><span class="avatar" data-size="sm"><span class="bg-muted">RS</span></span>Ren Sato</p></section>
    <section class="grid gap-1 border-b pb-3"><h2 class="text-muted-foreground text-xs font-medium" data-t="issue.labels">Labels</h2><p class="flex flex-wrap gap-1"><span class="badge" data-variant="destructive">bug</span><span class="badge" data-variant="outline">timetable</span></p></section>
  </aside>
  <form class="grid gap-2" hx-post="/r/class-site/issues/42/comments">
    <label class="label" for="comment" data-t="issue.add_comment">Add a comment</label>
    <textarea id="comment" name="text" class="textarea min-h-24"></textarea>
    <div class="flex flex-wrap justify-end gap-2">
      <button class="btn" data-variant="outline" type="submit" name="close" value="1" data-t="issue.close_with">Close with Comment</button>
      <button class="btn" type="submit" data-t="issue.comment">Comment</button>
    </div>
  </form>
</article>
```

The side column's headings are buttons in an editable view: each opens LabelsAssignees' picker.

## States

| State | What changes |
| --- | --- |
| Open | Green `badge` `issue.open`. |
| Closed | `badge` `issue.closed` (`bg-purple-700 text-white`); a timeline event “closed this”; the button becomes Reopen Issue (`issue.reopen`). |
| Empty reply box | Comment is disabled; the outline button reads Close Issue (`issue.close`) instead of Close with Comment. |
| Editing title | The `h1` becomes an `input` with Save / Cancel. |
| Editing a comment | Its section becomes a `textarea` with Save / Cancel; edited comments show `issue.edited`. |
| Reference | A line event: “mentioned this in #45” linking to the other issue. |
| Locked | Reply box replaced by `issue.locked`. |
| Read only (no permission) | No edit buttons, no reply box: `issue.sign_in` for visitors. |
| Not found / deleted | EmptyState `issue.not_found` with Back to Issues. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `issue.open` | Open | 未完了 |
| `issue.closed` | Closed | 完了 |
| `issue.opened` | {name} opened this {when} · {count} comments | {when}に {name} さんが作成 · コメント {count} 件 |
| `issue.edit_title` | Edit Title | タイトルを編集 |
| `issue.author` | Author | 作成者 |
| `issue.assignees` | Assignees | 担当者 |
| `issue.labels` | Labels | ラベル |
| `issue.links` | Linked | 関連 |
| `issue.add_comment` | Add a comment | コメントを追加 |
| `issue.comment` | Comment | コメント |
| `issue.close` | Close Issue | 課題を完了 |
| `issue.close_with` | Close with Comment | コメントして完了 |
| `issue.reopen` | Reopen Issue | 課題を再開 |
| `issue.added_label` | {name} added {label} {when} | {when}に {name} さんが {label} を追加 |
| `issue.closed_event` | {name} closed this {when} | {when}に {name} さんが完了 |
| `issue.mentioned_in` | {name} mentioned this in #{number} | {name} さんが #{number} で言及 |
| `issue.edited` | edited | 編集済み |
| `issue.locked` | This conversation is locked. | この会話はロックされています。 |
| `issue.sign_in` | Log in to comment. | コメントするにはログインしてください。 |
| `issue.not_found` | This issue doesn’t exist or was deleted. | この課題は存在しないか、削除されました。 |
| `issue.back` | Back to Issues | 課題一覧に戻る |

## Keyboard and focus

1. Edit Title → 2. each comment's actions (Edit, React) → 3. Add a comment → 4. Close with Comment → 5. Comment → 6. side column (Assignees, Labels).
- `Ctrl Return` (⌘ Return) in the reply box posts the comment. `r` quotes the selected text into the reply box.
- After posting, focus stays in the (now empty) reply box and the new comment is announced.

## Phone

- One column: header, side column folded into a row of chips under the title (assignee, labels, `+ Edit`), then conversation, then reply box.
- Close Issue moves into a `⋯` menu in the top bar; the reply box keeps only Comment.

## Data

```json
{"number": 42, "title": "Timetable page shows Saturday twice", "state": "open", "author": "Kana Abe",
 "created_at": "2026-10-16T14:20:00+09:00", "assignees": ["Ren Sato"], "labels": ["bug", "timetable"],
 "events": [{"type": "comment", "id": "c_1", "author": "Kana Abe", "text": "On the timetable page…", "at": "2026-10-16T14:20:00+09:00"},
            {"type": "labeled", "author": "Ren Sato", "label": "bug", "at": "2026-10-17T09:02:00+09:00"}]}
```

- Web: `POST …/comments {text, close}` → 201 and the new event `<li>` (plus the updated header when closing); `PATCH …/42 {state: "closed"}`.
- No server: `store.issues.update(42, {state})` appends the event itself.

## Don't

- Don't let closing delete anything; closed issues stay readable and can be reopened.
- Don't put the description outside the conversation list; it is the first comment.
- Don't render comment text as raw HTML; it is Markdown rendered by the app's sanitizer.
