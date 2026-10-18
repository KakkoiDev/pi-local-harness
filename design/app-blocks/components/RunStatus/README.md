# RunStatus

The status of an automated check run for a commit or pull request: queued, running, passed or failed, its steps, the failing log lines and re-run.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `card`, `badge`, `btn`, `alert`, `empty`; `details` for the failed step |
| Route | Part of a pull request (PullReview) or a commit page; `/runs/<id>` on its own |
| Needs | Web: `GET /runs/<id>`, `POST /runs/<id>/rerun`, `POST /runs/<id>/cancel`; needs a server and a runner |
| Links to | PullReview, CodeDiff, IssueDetail, Toasts, StatusBadges; used in AppCode |

## Markup

```html
<section id="run" class="card gap-4" aria-labelledby="run-title">
  <header class="grid gap-1">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 id="run-title" class="text-lg font-semibold" data-t="run.title">Checks</h2>
      <span class="flex items-center gap-1.5 text-sm"><span class="text-destructive"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg></span><span data-t="run.status.failed">Failed</span></span>
    </div>
    <p class="text-sm" role="status" aria-live="polite" data-t="run.summary">2 of 4 checks passed</p>
    <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg><span data-t-line="run.commit">Commit <code class="font-mono">a91f3c2</code> on <code class="font-mono">departure-times</code></span></span>
      <span data-t="run.triggered">Started by Ren Sato · 3 min ago</span>
    </p>
  </header>
  <section>
    <ol class="grid gap-2">
      <li class="flex items-center gap-3 rounded-md border p-3"><span class="flex-1 font-medium">Lint</span><span class="flex items-center gap-1.5 text-sm"><span class="text-success"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span data-t="run.status.passed">Passed</span></span><span class="text-xs tabular-nums text-muted-foreground" data-t="run.duration">8 s</span></li>
      <li class="flex items-center gap-3 rounded-md border p-3"><span class="flex-1 font-medium">Type check</span><span class="flex items-center gap-1.5 text-sm"><span class="text-success"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span data-t="run.status.passed">Passed</span></span><span class="text-xs tabular-nums text-muted-foreground" data-t="run.duration">14 s</span></li>
      <li>
        <details class="rounded-md border" open>
          <summary class="flex cursor-pointer items-center gap-3 p-3"><span class="flex-1 font-medium">Unit tests</span><span class="flex items-center gap-1.5 text-sm"><span class="text-destructive"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg></span><span data-t="run.status.failed">Failed</span></span><span class="text-xs tabular-nums text-muted-foreground" data-t="run.duration">41 s</span></summary>
          <div class="grid gap-2 border-t p-3">
            <pre class="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-5" aria-label="Last lines of the log for Unit tests" data-t-label="run.log_excerpt"><code>tests/test_trips.py::test_departure_time_format FAILED
    assert fmt(dep) == "09:52"
E   AssertionError: assert '9:52' == '09:52'
==== 1 failed, 47 passed in 3.82s ====</code></pre>
            <a class="text-sm underline underline-offset-4" href="/runs/2214/steps/3/log" data-t="run.full_log">View Full Log</a>
          </div>
        </details>
      </li>
      <li class="flex items-center gap-3 rounded-md border p-3"><span class="flex-1 font-medium">Build</span><span class="flex items-center gap-1.5 text-sm"><span class="text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg></span><span data-t="run.status.skipped">Skipped</span></span></li>
    </ol>
  </section>
  <footer class="flex flex-wrap gap-2"><button class="btn" data-size="sm" type="button" data-t="run.rerun_failed"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>Re-run Failed</button><button class="btn" data-variant="outline" data-size="sm" type="button" data-t="run.rerun_all">Re-run All</button></footer>
</section>

<!-- while running: the summary line and the footer -->
<p class="text-sm" role="status" aria-live="polite" data-t="run.summary_running">1 of 4 checks done</p>
<button class="btn" data-variant="outline" data-size="sm" type="button" data-t="run.cancel">Cancel Run</button>

<!-- compact form, in a list of commits or pull requests -->
<p class="flex flex-wrap items-center gap-2 text-sm"><a class="font-medium hover:underline" href="#run">#42 Show times with two digits</a><span class="badge" data-variant="destructive"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg><span data-t="run.status.failed">Failed</span></span><span class="badge" data-variant="outline"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg><span data-t="run.status.queued">Queued</span></span></p>
```

- One run per commit: the overall status at the top right, the summary line (`run.summary`), the commit and who started it, then one row per step in order.
- Each status is an icon **and** a word (`run.status.*`): passed `text-success`, failed `text-destructive`, running a spinning loader, queued and skipped muted. Never colour alone.
- A failed step opens by itself (`details open`) and shows the last lines of its log in a scrolling `pre`, with **View Full Log**. Other steps are one line.
- **Re-run Failed** is the default after a failure; **Re-run All** beside it. While running, the only action is **Cancel Run**.
- The summary line is `role="status" aria-live="polite"`: screen readers hear the run finish without the page moving focus.

## States

| State | What changes |
| --- | --- |
| Queued | Every step `run.status.queued`; the summary shows `run.waiting` until a runner picks it up. |
| Running | The running step shows the loader; the summary is `run.summary_running` (done of total); footer: Cancel Run. The page polls every 5 seconds (or a WebSocket push) and updates rows in place. |
| Passed | Every step passed; the overall status is Passed; the footer keeps only Re-run All. |
| Failed | As in the Markup: the failed step open with its log; later steps `skipped`; Re-run Failed and Re-run All. |
| Re-run started | Toast: `run.rerun_started` with the count; the rows go back to Queued. |
| Cancelled | Unfinished steps show `run.status.cancelled`. |
| No checks | The empty block `run.none`. |
| Couldn’t load | The destructive alert `run.error.load` with Try Again. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `run.title` | Checks | チェック |
| `run.summary` | {passed} of {total} checks passed | {total}件中{passed}件のチェックに合格 |
| `run.summary_running` | {done} of {total} checks done | {total}件中{done}件のチェックが完了 |
| `run.commit` | Commit {sha} on {branch} | {branch}のコミット {sha} |
| `run.triggered` | Started by {name} · {when} | {name}が実行・{when} |
| `run.status.queued` | Queued | 待機中 |
| `run.status.running` | Running | 実行中 |
| `run.status.passed` | Passed | 合格 |
| `run.status.failed` | Failed | 失敗 |
| `run.status.skipped` | Skipped | スキップ |
| `run.status.cancelled` | Cancelled | キャンセル |
| `run.duration` | {seconds} s | {seconds}秒 |
| `run.waiting` | Waiting for a runner | 実行環境を待っています |
| `run.log` | Log | ログ |
| `run.log_excerpt` | Last lines of the log for {step} | {step}のログの最後の行 |
| `run.full_log` | View Full Log | ログ全体を見る |
| `run.rerun_failed` | Re-run Failed | 失敗したものを再実行 |
| `run.rerun_all` | Re-run All | すべて再実行 |
| `run.cancel` | Cancel Run | 実行をキャンセル |
| `run.rerun_started` | Re-running {count} checks | {count}件のチェックを再実行しています |
| `run.none` | No checks ran for this commit. | このコミットではチェックは実行されていません。 |
| `run.error.load` | Couldn’t load the checks. Try again in a moment. | チェックを読み込めませんでした。少し待ってからもう一度お試しください。 |
| `run.retry` | Try Again | もう一度試す |

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
