# PullReview

Reviewing a proposed change: the files it touches, comments on lines, and finishing the review with Approve, Request Changes or Comment, plus merging when the checks pass.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `tabs`, `btn`, `badge`, `dialog`, `textarea`, `input` (radio), `alert` |
| Route | `/r/{repo}/pulls/{n}` (Conversation), `/r/{repo}/pulls/{n}/files` (Files) |
| Needs | needs a server: `GET /r/{repo}/pulls/{n}/files`, `POST …/comments {path, line, side, text}`, `POST …/reviews {verdict, text}`, `POST …/merge`. Blocks: CodeDiff, FileTree, Comments, IssueDetail (the conversation tab is the same layout), ConfirmDialog |
| Used in | AppCode |

## Markup

```html
<section class="grid gap-3" aria-labelledby="pr-title">
  <header class="grid gap-1">
    <h1 id="pr-title" class="text-xl font-semibold">Use Monday as week start <span class="text-muted-foreground font-normal">#45</span></h1>
    <p class="flex flex-wrap items-center gap-2 text-sm"><span class="badge bg-success text-success-foreground" data-t="pr.open">Open</span>
      <span class="text-muted-foreground" data-t="pr.wants">Ren Sato wants to merge 2 commits into main from week-start</span></p>
  </header>
  <div class="tabs" id="pr-tabs">
    <nav role="tablist" aria-orientation="horizontal" class="w-full justify-start">
      <button type="button" role="tab" id="pr-tab-1" aria-controls="pr-panel-1" aria-selected="false" tabindex="-1" data-t="pr.conversation">Conversation</button>
      <button type="button" role="tab" id="pr-tab-2" aria-controls="pr-panel-2" aria-selected="true" tabindex="0"><span data-t="pr.files">Files</span> <span class="badge" data-variant="secondary">3</span></button>
    </nav>
    <div role="tabpanel" id="pr-panel-2" aria-labelledby="pr-tab-2" class="grid gap-3">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-muted-foreground" data-t="pr.viewed">1 of 3 files viewed</span>
        <button class="btn ml-auto" type="button" aria-haspopup="dialog" aria-controls="review-dialog" onclick="document.getElementById('review-dialog').showModal()" data-t="pr.finish">Finish Review</button>
      </div>
      <!-- one CodeDiff section per file; a line comment is a row under its line: -->
      <table class="w-full font-mono text-[13px]"><tbody>
        <tr class="group bg-success/10"><td class="w-16 px-2 text-right text-muted-foreground"><button class="btn invisible group-hover:visible focus-visible:visible" data-variant="ghost" data-size="icon-xs" type="button" aria-label="Comment on line 3" data-t-label="pr.comment_line">+</button> 3</td><td class="px-3 whitespace-pre"><span class="text-success">+</span>WEEK_START = 0  # Monday</td></tr>
        <tr><td colspan="2" class="p-3 font-sans">
          <div class="card gap-2 py-3">
            <header class="flex items-center gap-2 text-sm"><b>Kana Abe</b><span class="badge" data-variant="outline" data-t="pr.pending">Pending</span></header>
            <section><p class="text-sm">Can we read this from the term settings instead of hard-coding it?</p></section>
          </div>
        </td></tr>
      </tbody></table>
    </div>
  </div>
  <dialog id="review-dialog" class="dialog" aria-labelledby="review-title">
    <div>
      <header><h2 id="review-title" data-t="pr.finish">Finish Review</h2></header>
      <section class="grid gap-3">
        <textarea class="textarea min-h-24" name="text" aria-label="Summary" placeholder="Leave a summary (optional)" data-t-placeholder="pr.summary"></textarea>
        <fieldset class="grid gap-2" role="radiogroup">
          <label class="label gap-2 font-normal"><input class="input" type="radio" name="verdict" value="comment" checked><span><b data-t="pr.v.comment">Comment</b> <span class="text-muted-foreground text-sm" data-t="pr.v.comment_hint">Feedback without approving.</span></span></label>
          <label class="label gap-2 font-normal"><input class="input" type="radio" name="verdict" value="approve"><span><b data-t="pr.v.approve">Approve</b> <span class="text-muted-foreground text-sm" data-t="pr.v.approve_hint">Ready to merge.</span></span></label>
          <label class="label gap-2 font-normal"><input class="input" type="radio" name="verdict" value="changes"><span><b data-t="pr.v.changes">Request Changes</b> <span class="text-muted-foreground text-sm" data-t="pr.v.changes_hint">Must be fixed before merging.</span></span></label>
        </fieldset>
      </section>
      <footer><button class="btn" data-variant="outline" type="button" data-t="pr.cancel">Cancel</button><button class="btn" type="submit" data-t="pr.submit">Submit Review</button></footer>
    </div>
  </dialog>
</section>
```

Each file header has a Viewed checkbox (`pr.mark_viewed`): checking it folds the file and counts it. Hovering a line number shows a `+` button (`btn data-size="icon-xs"`, label `pr.comment_line`) that opens an inline form: textarea, Cancel, Add Single Comment, Start a Review.

## States

| State | What changes |
| --- | --- |
| Draft comments | Comments added during a review show `pr.pending` until Submit Review; the Finish Review button shows their count. |
| Approved / changes requested | The Conversation tab lists the review with a `badge`: `pr.approved` (`bg-success text-success-foreground`) or `pr.changes_requested` (destructive). |
| Checks running | A merge box at the end of Conversation: `pr.checks_running` with a spinner glyph; Merge disabled. |
| Checks failed | `alert data-variant="destructive"` `pr.checks_failed` with Show Details; Merge disabled. |
| Ready to merge | `pr.ready` and a Merge button (ConfirmDialog: `pr.merge_q`). |
| Conflicts | `pr.conflicts`; Merge disabled with the reason. |
| Merged / closed | `badge` `pr.merged` (`bg-primary text-primary-foreground`) or `pr.closed`; reply box stays for comments. |
| Outdated comment | A comment on a line that changed since shows `pr.outdated` and folds. |
| Your own change | Approve and Request Changes are disabled with `pr.own` (you can comment). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `pr.open` | Open | オープン |
| `pr.wants` | {name} wants to merge {count} commits into {base} from {head} | {name} さんが {head} から {base} へ {count} 件のコミットのマージを希望しています |
| `pr.conversation` | Conversation | 会話 |
| `pr.files` | Files | ファイル |
| `pr.viewed` | {done} of {count} files viewed | {count} ファイル中 {done} 件確認済み |
| `pr.mark_viewed` | Viewed | 確認済み |
| `pr.comment_line` | Comment on line {line} | {line} 行目にコメント |
| `pr.single` | Add Single Comment | 単独でコメント |
| `pr.start_review` | Start a Review | レビューを開始 |
| `pr.pending` | Pending | 未送信 |
| `pr.finish` | Finish Review | レビューを完了 |
| `pr.summary` | Leave a summary (optional) | まとめ（任意） |
| `pr.v.comment` | Comment | コメント |
| `pr.v.comment_hint` | Feedback without approving. | 承認せずにフィードバックします。 |
| `pr.v.approve` | Approve | 承認 |
| `pr.v.approve_hint` | Ready to merge. | マージしてよい状態です。 |
| `pr.v.changes` | Request Changes | 修正を依頼 |
| `pr.v.changes_hint` | Must be fixed before merging. | マージ前に修正が必要です。 |
| `pr.cancel` | Cancel | キャンセル |
| `pr.submit` | Submit Review | レビューを送信 |
| `pr.approved` | Approved | 承認済み |
| `pr.changes_requested` | Changes requested | 修正依頼あり |
| `pr.checks_running` | Checks are running… | チェックを実行中… |
| `pr.checks_failed` | 1 check failed. Fix it before merging. | 1 件のチェックが失敗しました。マージ前に修正してください。 |
| `pr.ready` | All checks passed and it was approved. | すべてのチェックに合格し、承認されました。 |
| `pr.merge` | Merge | マージ |
| `pr.merge_q` | Merge #{number} into {base}? | #{number} を {base} にマージしますか？ |
| `pr.conflicts` | This change conflicts with {base}. Update the branch first. | {base} と競合しています。先にブランチを更新してください。 |
| `pr.merged` | Merged | マージ済み |
| `pr.closed` | Closed | クローズ |
| `pr.outdated` | Outdated | 古い差分 |
| `pr.own` | You can’t approve your own change. | 自分の変更は承認できません。 |

## Keyboard and focus

1. Conversation / Files tabs (← → between them) → 2. Finish Review → 3. each file: Viewed, fold, lines (CodeDiff order) → 4. comment forms.
- `n`/`p` next/previous change, `]`/`[` next/previous file, `v` marks the file viewed, `c` comments on the focused line.
- Finish Review opens the dialog with focus in the summary; Esc cancels and returns focus to the button; drafts are kept.

## Phone

- Files tab shows one file at a time with a file `select` and Previous/Next File buttons at the bottom.
- Line comments: tap a line number, then Comment in the action sheet; the form opens as a sheet.
- Finish Review is a full-width button at the bottom of Files; the dialog is a full-screen sheet.

## Data

```json
{"number": 45, "title": "Use Monday as week start", "state": "open", "base": "main", "head": "week-start", "commits": 2,
 "files": [{"path": "app/calendar.py", "added": 3, "removed": 1, "viewed": true}],
 "comments": [{"id": "rc_9", "path": "app/calendar.py", "line": 3, "side": "new", "author": "Kana Abe", "text": "Can we read this from the term settings?", "pending": true}],
 "checks": [{"name": "tests", "state": "passed"}], "reviews": [], "mergeable": true}
```

- Web: `POST …/reviews {verdict: "approve"|"changes"|"comment", text}` publishes pending comments with it; 422 if approving your own change.
- Merge: `POST …/merge` → 200 and the merged header; 409 on conflicts.

## Don't

- Don't allow Merge while checks fail or changes are requested; show why it's disabled.
- Don't drop pending comments when the dialog is cancelled.
- Don't anchor comments to line numbers only; store `path`, `side` and the line's content hash so they can be marked outdated.
