# RunStatus

App Block card (Collaboration). The status of an automated check run for a commit or pull request: queued, running, passed or failed, its steps, the failing log lines and re-run.

- Basecoat: `card`, `badge`, `btn`, `alert`, `empty`; `details` for the failed step
- Route: Part of a pull request (PullReview) or a commit page; `/runs/<id>` on its own
- Needs: Web: `GET /runs/<id>`, `POST /runs/<id>/rerun`, `POST /runs/<id>/cancel`; needs a server and a runner
- Links to: PullReview, CodeDiff, IssueDetail, Toasts, StatusBadges; used in AppCode

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/RunStatus.html` (40 lines of HTML).

- One run per commit: the overall status at the top right, the summary line (`run.summary`), the commit and who started it, then one row per step in order.
- Each status is an icon **and** a word (`run.status.*`): passed `text-success`, failed `text-destructive`, running a spinning loader, queued and skipped muted. Never colour alone.
- A failed step opens by itself (`details open`) and shows the last lines of its log in a scrolling `pre`, with **View Full Log**. Other steps are one line.
- **Re-run Failed** is the default after a failure; **Re-run All** beside it. While running, the only action is **Cancel Run**.
- The summary line is `role="status" aria-live="polite"`: screen readers hear the run finish without the page moving focus.

## States
- Queued: Every step `run.status.queued`; the summary shows `run.waiting` until a runner picks it up.
- Running: The running step shows the loader; the summary is `run.summary_running` (done of total); footer: Cancel Run. The page polls every 5 seconds (or a WebSocket push) and updates rows in place.
- Passed: Every step passed; the overall status is Passed; the footer keeps only Re-run All.
- Failed: As in the Markup: the failed step open with its log; later steps `skipped`; Re-run Failed and Re-run All.
- Re-run started: Toast: `run.rerun_started` with the count; the rows go back to Queued.
- Cancelled: Unfinished steps show `run.status.cancelled`.
- No checks: The empty block `run.none`.
- Couldn’t load: The destructive alert `run.error.load` with Try Again.

## Texts
(Key | English | 日本語)
- `run.title`: Checks | チェック
- `run.summary`: {passed} of {total} checks passed | {total}件中{passed}件のチェックに合格
- `run.summary_running`: {done} of {total} checks done | {total}件中{done}件のチェックが完了
- `run.commit`: Commit {sha} on {branch} | {branch}のコミット {sha}
- `run.triggered`: Started by {name} · {when} | {name}が実行・{when}
- `run.status.queued`: Queued | 待機中
- `run.status.running`: Running | 実行中
- `run.status.passed`: Passed | 合格
- `run.status.failed`: Failed | 失敗
- `run.status.skipped`: Skipped | スキップ
- `run.status.cancelled`: Cancelled | キャンセル
- `run.duration`: {seconds} s | {seconds}秒
- `run.waiting`: Waiting for a runner | 実行環境を待っています
- `run.log`: Log | ログ
- `run.log_excerpt`: Last lines of the log for {step} | {step}のログの最後の行
- `run.full_log`: View Full Log | ログ全体を見る
- `run.rerun_failed`: Re-run Failed | 失敗したものを再実行
- `run.rerun_all`: Re-run All | すべて再実行
- `run.cancel`: Cancel Run | 実行をキャンセル
- `run.rerun_started`: Re-running {count} checks | {count}件のチェックを再実行しています
- `run.none`: No checks ran for this commit. | このコミットではチェックは実行されていません。
- `run.error.load`: Couldn’t load the checks. Try again in a moment. | チェックを読み込めませんでした。少し待ってからもう一度お試しください。
- `run.retry`: Try Again | もう一度試す

## Keyboard and focus
1. Each step's summary (a failed step's `details` toggles with Return or Space) → 2. View Full Log → 3. Re-run Failed → 4. Re-run All (or Cancel Run).
- The log excerpt scrolls with the arrow keys once focused (it is focusable through its `pre`'s parent details).

## Phone
- Same card, full width; the commit line wraps under the summary.
- The log excerpt scrolls sideways inside its box; long lines never widen the page.
- The footer buttons are 44 px tall and wrap.

## Data
```json
{"run": {"id": 2214, "commit": "a91f3c2", "branch": "departure-times", "started_by": "ren", "started": "2026-10-18T09:09:00+09:00",
  "status": "queued | running | passed | failed | cancelled",
  "steps": [{"name": "Lint", "status": "passed", "seconds": 8},
            {"name": "Unit tests", "status": "failed", "seconds": 41, "log_tail": "tests/test_trips.py::… FAILED\n…", "log_url": "/runs/2214/steps/3/log"},
            {"name": "Build", "status": "skipped", "seconds": null}]}}
```

- Web: `GET /runs/<id>` (fragment; `hx-trigger="every 5s"` while running, stops when finished), `POST /runs/<id>/rerun?only=failed`, `POST /runs/<id>/cancel`. Needs a server and a runner (the app's own CI, or a GitHub Actions status read through its API).
- No server: not available.

## Don't
- Don't show the whole log inline; the last 20 lines at most, with View Full Log.
- Don't mark a run passed while a step is still queued or running.
- Don't use colour as the only sign of a status.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> RunStatus` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
