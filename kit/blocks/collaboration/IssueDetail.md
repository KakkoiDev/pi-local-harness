# IssueDetail

App Block card (Collaboration). One issue: its title and state, the description, the conversation and events in time order, a reply box with Close Issue, and a side column for assignees, labels and links.

- Basecoat: `badge`, `btn`, `button-group`, `avatar`, `textarea`, `card`
- Route: `/r/{repo}/issues/{number}`
- Needs: Web: `GET /r/{repo}/issues/{n}`, `POST …/comments`, `PATCH /r/{repo}/issues/{n}` (title, state, labels, assignees). No server: `store.issues.get/update/comment`. Blocks: Comments, Reactions, Mentions, LabelsAssignees, Timeline, ConfirmDialog
- Used in: AppCode, AppBoard, AppCrm

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/IssueDetail.html` (29 lines of HTML).

The side column's headings are buttons in an editable view: each opens LabelsAssignees' picker.

## States
- Open: Green `badge` `issue.open`.
- Closed: `badge` `issue.closed` (`bg-purple-700 text-white`); a timeline event “closed this”; the button becomes Reopen Issue (`issue.reopen`).
- Empty reply box: Comment is disabled; the outline button reads Close Issue (`issue.close`) instead of Close with Comment.
- Editing title: The `h1` becomes an `input` with Save / Cancel.
- Editing a comment: Its section becomes a `textarea` with Save / Cancel; edited comments show `issue.edited`.
- Reference: A line event: “mentioned this in #45” linking to the other issue.
- Locked: Reply box replaced by `issue.locked`.
- Read only (no permission): No edit buttons, no reply box: `issue.sign_in` for visitors.
- Not found / deleted: EmptyState `issue.not_found` with Back to Issues.

## Texts
(Key | English | 日本語)
- `issue.open`: Open | 未完了
- `issue.closed`: Closed | 完了
- `issue.opened`: {name} opened this {when} · {count} comments | {when}に {name} さんが作成 · コメント {count} 件
- `issue.edit_title`: Edit Title | タイトルを編集
- `issue.author`: Author | 作成者
- `issue.assignees`: Assignees | 担当者
- `issue.labels`: Labels | ラベル
- `issue.links`: Linked | 関連
- `issue.add_comment`: Add a comment | コメントを追加
- `issue.comment`: Comment | コメント
- `issue.close`: Close Issue | 課題を完了
- `issue.close_with`: Close with Comment | コメントして完了
- `issue.reopen`: Reopen Issue | 課題を再開
- `issue.added_label`: {name} added {label} {when} | {when}に {name} さんが {label} を追加
- `issue.closed_event`: {name} closed this {when} | {when}に {name} さんが完了
- `issue.mentioned_in`: {name} mentioned this in #{number} | {name} さんが #{number} で言及
- `issue.edited`: edited | 編集済み
- `issue.locked`: This conversation is locked. | この会話はロックされています。
- `issue.sign_in`: Log in to comment. | コメントするにはログインしてください。
- `issue.not_found`: This issue doesn’t exist or was deleted. | この課題は存在しないか、削除されました。
- `issue.back`: Back to Issues | 課題一覧に戻る

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> IssueDetail` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
