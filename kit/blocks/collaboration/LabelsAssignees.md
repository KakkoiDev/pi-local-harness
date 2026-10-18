# LabelsAssignees

App Block card (Collaboration). Pickers that set the labels and the people on an item (an issue, a card, a ticket): a searchable checklist in a popover, the chosen ones shown as badges and avatars, and a page to manage the labels themselves.

- Basecoat: `popover`, `input-group`, `input` (checkbox), `badge`, `avatar`, `btn`, `table`
- Route: pickers: none (inside IssueDetail, Kanban); labels page: `/r/{repo}/labels`
- Needs: Web: `GET /labels`, `GET /people?can_assign=1`, `PATCH /items/{id} {labels, assignees}`, `POST/PATCH/DELETE /labels`. No server: `store.labels.*`, `store.items.update`. Blocks: IssueDetail, IssueList, Kanban, Roles
- Used in: AppCode, AppBoard, AppCrm

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/LabelsAssignees.html` (19 lines of HTML).

The assignees picker is the same popover with people (avatar, name, handle) instead of labels, a `labels.assign_me` shortcut at the top, and at most 10 people.

Label colours: `destructive` for bugs, otherwise one of `var(--chart-1)` … `var(--chart-5)` shown as a dot inside an `outline` badge, so text keeps its contrast in both themes. The labels page offers exactly these six choices.

## States
- None set: Under the heading: `labels.none` / `assign.none` with `assign.me` link for assignees.
- Picking: Checking applies at once in the popover's list; the change is saved when the popover closes (one request).
- Filtering: Typing filters; no match shows `labels.create_q` with a Create “{name}” button (if allowed).
- No permission: Headings are plain text, no popover.
- Many: Badges wrap; more than 6 people collapse to an `avatar-group` with `+N`.
- Saving failed: The previous set comes back; toast `labels.failed`.
- Labels page: A `table`: Label (badge preview), Description, Issues (count), Edit / Delete; New Label opens a `dialog` (name, description, colour radio of six). Delete asks ConfirmDialog `labels.delete_q`.
- Managing labels: Each label row in Edit Labels shows `labels.count` (“12 issues”) in `<span class="text-muted-foreground" data-t="labels.count">`.

## Texts
(Key | English | 日本語)
- `labels.title`: Labels | ラベル
- `labels.apply`: Apply labels to this issue | この課題にラベルを付ける
- `labels.filter`: Filter labels | ラベルを絞り込む
- `labels.manage`: Edit Labels | ラベルを編集
- `labels.none`: None yet | なし
- `labels.create_q`: No label called “{name}” | 「{name}」というラベルはありません
- `labels.create`: Create “{name}” | 「{name}」を作成
- `labels.failed`: Couldn’t save the labels. Try again. | ラベルを保存できませんでした。もう一度お試しください。
- `labels.new`: New Label | 新しいラベル
- `labels.name`: Name | 名前
- `labels.description`: Description | 説明
- `labels.colour`: Colour | 色
- `labels.count`: {count} issues | 課題 {count} 件
- `labels.delete_q`: Delete the label “{name}”? It will be removed from {count} issues. | ラベル「{name}」を削除しますか？ {count} 件の課題から外されます。
- `assign.title`: Assignees | 担当者
- `assign.none`: No one | 未割り当て
- `assign.me`: Assign Yourself | 自分を割り当て
- `assign.filter`: Filter people | メンバーを絞り込む

## Keyboard and focus
1. Labels heading button → 2. (open) filter field → 3. each checkbox → 4. Edit Labels.
- Opening puts focus in the filter field; ↓ moves into the list; Space toggles; Esc or clicking outside closes and saves, returning focus to the heading button.
- `l` opens Labels and `a` opens Assignees from the issue page (ShortcutHelp).

## Phone
- The pickers open as bottom sheets with 44 px rows and a Done button; saving happens on Done.
- The badges row under the heading wraps; the whole section is one tap target that opens the sheet.

## Data
```json
{"labels": [{"name": "bug", "description": "Something isn’t working", "colour": "destructive", "count": 9},
            {"name": "timetable", "description": "", "colour": "chart-1", "count": 4}],
 "item": {"id": "issue_42", "labels": ["bug", "timetable"], "assignees": ["u_12"]}}
```

- Web: `PATCH /items/issue_42 {labels: [...], assignees: [...]}` → 200 and the section fragment; events are added to the issue timeline.
- No server: `store.items.update("issue_42", {labels})`.

## Don't
- Don't let people pick any hex colour; only the six choices.
- Don't save on every checkbox click; save once when the picker closes.
- Don't hide the labels page from the picker; Edit Labels is always the last line for people allowed to edit.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> LabelsAssignees` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
