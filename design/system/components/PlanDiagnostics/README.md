# PlanDiagnostics

System 1's check of the saved plan files (ROADMAP.md and tasks/*.md): every finding with its file and line, the identity choice for two tasks with one number, and a bounded repair that Pi proposes, the harness validates and the person applies (task 322). Boards: canvas page "Round 15" — R15_PlanDiagnostics, R15_PlanChat, R15_DuplicateTask, R15_PlanRepair, R15_PlanStates, R15_Plan1024, R15_PlanStrings, R15_PlanWalkthrough, Ph15_PlanDiagnostics, Ph15_PlanSource, Ph15_PlanRepair, Ph15_DuplicateTask.

## What the check reads

- The **saved** files, never text pasted into the chat (escaping in a pasted message is not evidence of anything in the file). It runs on every save of a plan file, when Pi reads the plan, and on **Check Again**. It is code (System 1), deterministic, and needs no model.
- Supported, no finding: `- [ ] [004 Title](tasks/004-title.md)` and the older `- [ ] 004 Title` without a link (matched to `tasks/004-*.md`).
- Malformed files stay readable and editable in Work (Page and Source); the check never blocks opening, editing, saving or chatting.

## Three kinds of finding

Told apart by glyph **and** word, never by tone alone:

| Kind | Glyph | Meaning | Example (Pong) |
| --- | --- | --- | --- |
| **Error** | filled square `.pw-mark--error` | The plan can't be read as tasks | `ROADMAP.md:10–11` two different tasks numbered 004; `ROADMAP.md:15–21` task 003's steps written in ROADMAP.md |
| **Not supported** | dashed square `.pw-mark--unsupported` | A format the checks can't read (tasks as a table) | `ROADMAP.md:5–12` "Tasks are a table, not a list" |
| **Note** | ring with i `.pw-mark--note` | Advisory evidence; nothing is broken | `ROADMAP.md:13` the same link twice; `ROADMAP.md:19` done but Red unchecked |

## Anatomy

- **Plan Check card** (in the chat, `section.pw-card[aria-label="Plan Check"]`): head (plan glyph, "Plan Check", project · counts); `.pw-diag__summary` (`role="status"`: counts and "checked 14:31 from the saved files"); `ul.pw-diag__group` — one `li` per finding: mark, kind word, `a.pw-diag__where` (file:line, opens Work at the line), the action link (Open · Choose… · Why?), the finding and one `small` line; foot: **Ask Pi to Repair…** (or its disabled form).
- **Plan Check panel** (desk window "Plan Check · Pong", opened by **Show Plan Check** in Work's info bar or the notice): the same rows grouped "Errors: the plan can't be read as tasks" / "Notes: worth a look, nothing is broken", plus the line "The check reads the saved files, not text pasted in the chat."
- **Work, Source view** (`.pw-src`): line numbers, a mark in the gutter on each finding's line (`data-mark`), the selected finding's line outlined (`aria-current`). Work's info bar shows the counts and **Show Plan Check**. The text stays editable.
- **Harness notice** (`.pw-notice`, "Harness"): under Pi's answer when Pi read a plan with errors: "The plan files have 2 errors and 3 notes. Pi read them as written; tasks 004 are ambiguous until you choose." **Show Plan Check**.

## Phases (reuses PhaseControl; no new phase rule)

- Diagnosis works in **every** phase (it only reads).
- Repair writes ROADMAP.md and tasks/, which **Planning** allows. In Discussion and Implementation, **Ask Pi to Repair…** is visible and disabled with "Repairs write ROADMAP.md and tasks/, which only Planning allows." and **Change Phase…** (opens the phase control; the person chooses). The repair never edits app files.

## Identity: two different tasks, one number

A card "Which task keeps number 004?" (`role="radiogroup"`), System 1's question, not Pi's: a two-column comparison (file · line, title, state, steps done, created; Done when) and four options: "“Ball speeds up” keeps 004" (the other becomes the next free number, 006, file renamed, links updated) · "“Score display” keeps 004" · "They are the same task" (merge; both files' steps and history kept; shown for review) · "Leave both as 004 for now" (the rest is repaired; this stays an error). **Use This**; nothing is written until the repair is applied. Never a silent renumber or discard. Settles to one line like any choice. A **repeated identical link** (same target, same title) is a separate Note: the repair keeps the first and removes the copy, shown in the review; no choice.

## Evidence gap

Checked Green with unchecked Red: a Note "Done, but Red not recorded": nothing shows a test failed before the fix. The repair keeps Red unchecked and appends "(Red not recorded)"; it never checks Red or writes a past test. **Plan a Test Task…** (optional) starts Planning a task that adds the test; the task stays done.

## Repair

1. In Planning, **Ask Pi to Repair…** sends "Repair the plan files." (the person's message, with the findings attached as context). Pi writes; the Gate allows only ROADMAP.md and tasks/.
2. Pi's result is a proposal, not the files: System 1 validates it (no errors left except chosen ones, no task added or lost by count, no app file changed, goals/Done when/links/history preserved, the file unchanged since the check) and shows **"Plan repair ready to review"** (4 files · check passed) with **Review Changes…** and **Discard**.
3. **Review the plan repair** (dialog on the desk, sheet on the phone): `.pw-verdict` ("Check passed · 0 errors · 2 notes kept · no app file changed · no task added or lost (6 → 6)"), `.pw-filelist` (changed files, renames shown as "a → b"), `.pw-diff` (one column, +/−, removed lines struck, moved text marked "words unchanged"); Discard · Open Original · **Apply Repair** (default).
4. Applied: the originals go to the project's Trash (recoverable); Work reloads; a done row "Repaired the plan files: …" with **Show ROADMAP.md** and **Restore Original…**.
5. Asked again with nothing left: "Plan Check · no problems — Asked to repair again: nothing to repair. No task added, no file written."

## States

| State | What shows |
| --- | --- |
| Valid | "No problems · ROADMAP.md and 5 task files · checked 14:31" |
| Valid, older format | no finding; a note in the card that older lines are matched by number |
| Errors plus notes | counts, grouped rows, repair button (enabled in Planning, disabled with reason otherwise) |
| Unsupported format | the Not supported row; the file stays readable; repair can convert, keeping every cell |
| Ambiguous identity | the 004 choice card; repair waits for it or proceeds with "Leave both" |
| Repair preparing | "Plan repair being prepared — the plan files stay as they are until you apply it; you can keep editing them." **Stop** |
| Review ready | the ready card; the review |
| Validation failure | "The repair didn't pass the check" · `.pw-verdict[data-state=fail]` "Not applied" + the reasons · "Nothing was written. The original files are unchanged." **Ask Pi to Try Again** · Show Changes · Discard |
| Concurrent edit | "ROADMAP.md changed while the repair was prepared — Your edit is kept; the repair wasn't applied…" **Check Again** · Show My Edit · Discard Repair |
| Repaired, reloaded | the done row; Work shows the new file; the check shows no errors |
| Restore original | alert "Restore the plan files from before the repair?" — the repaired versions go to Trash; later edits kept as copies beside them; Cancel · **Restore Original** |

## Texts (EN · JA)

| English | 日本語 |
| --- | --- |
| Plan Check | プランの確認 |
| {n} errors · {m} notes | エラー {n} 件 · メモ {m} 件 |
| No problems | 問題はありません |
| Error / Not supported / Note | エラー / 未対応 / メモ |
| Checked {time} from the saved files | {time} に保存済みのファイルから確認 |
| Show Plan Check | プランの確認を表示 |
| Ask Pi to Repair… | Pi に修復を頼む… |
| Repairs write ROADMAP.md and tasks/, which only Planning allows. | 修復は ROADMAP.md と tasks/ に書き込むため、計画フェーズでのみ行えます。 |
| Two different tasks are numbered {n} | {n} 番が別々の 2 つのタスクに付いています |
| Which task keeps number {n}? | {n} 番を残すタスクはどれですか？ |
| “{title}” keeps {n} | 「{title}」が {n} 番のまま |
| They are the same task | 同じタスクです |
| Leave both as {n} for now | いまは両方 {n} 番のまま |
| Use This | これにする |
| The same link to task {n} appears twice | タスク {n} への同じリンクが 2 回あります |
| Done, but Red not recorded | 完了済み、ただし Red の記録なし |
| Plan a Test Task… | テストのタスクを計画… |
| Task {n}’s steps are written in ROADMAP.md | タスク {n} の手順が ROADMAP.md に書かれています |
| Tasks are a table, not a list | タスクがリストではなく表になっています |
| Plan repair ready to review | プランの修復を確認できます |
| Review Changes… / Review the plan repair | 変更を確認… / プランの修復を確認 |
| Check passed | 確認に合格 |
| Apply Repair / Open Original / Discard | 修復を適用 / 元のファイルを開く / 破棄 |
| The repair didn’t pass the check / Not applied | 修復が確認に合格しませんでした / 適用していません |
| Ask Pi to Try Again | Pi にもう一度頼む |
| {file} changed while the repair was prepared | 修復の準備中に {file} が変更されました |
| Check Again / Show My Edit | もう一度確認 / 自分の編集を表示 |
| Restore Original… / Restore the plan files from before the repair? | 元に戻す… / 修復前のプランファイルに戻しますか？ |
| Nothing to repair | 修復するものはありません |

## Disabled reasons

- Ask Pi to Repair…: "Repairs write ROADMAP.md and tasks/, which only Planning allows." (Discussion, Implementation); "Pi is working on another request. It starts after it." (busy: queued like any request, not disabled).
- Apply Repair: never disabled once the review is open; a stale or failed proposal shows its state card instead of the review.
- Use This: disabled until an option is chosen ("Choose one first").

## Keyboard, focus, live

- Plan Check list: ↑ ↓ between findings (Work follows to the line); Return opens the file at the line (focus in Source, caret on the line). Proposed: ⌃⌥. / ⌃⌥, next/previous finding in Work (free in the R12 shortcut table).
- Review: focus starts on the changed-files list; Tab → diff → Discard → Open Original → Apply Repair; Esc closes and keeps the proposal (**Review Changes…** reopens it). Return focus: closing the review → Review Changes…; Apply Repair → the done row; Use This → the next finding.
- Live: `.pw-diag__summary` is `role="status"`, re-announced only when a count changes; the failure verdict is `role="alert"`; the preparing card `role="status"`.

## Phone

- The card in the chat; a finding's location opens Work at the line full screen with the finding pinned above the source and **‹ Previous / Next ›** (44 px) at the bottom.
- The 004 choice and the review are sheets; the diff scrolls in its own box; Apply Repair is the default touch button.
- 320 px: the location wraps under the kind; the action link stays on the first line; the disabled button and its reason stack; only the source and diff scroll sideways, each in its box.

## Data

```json
{"checked_at": "2026-10-19T14:31:00+09:00", "files": ["ROADMAP.md", "tasks/001-paddles.md"],
 "findings": [{"kind": "error", "code": "duplicate-number", "file": "ROADMAP.md", "line": 10, "end_line": 11, "number": "004",
               "tasks": [{"title": "Ball speeds up", "file": "tasks/004-speed.md"}, {"title": "Score display", "file": "tasks/004-score.md"}]},
              {"kind": "note", "code": "red-not-recorded", "file": "ROADMAP.md", "line": 19, "task": "003"}],
 "choices": {"duplicate-number:004": {"keep": "tasks/004-speed.md", "renumber_to": "006", "by": "you", "at": "14:34"}},
 "repair": {"id": "r-0419", "state": "review|applied|failed|stale|discarded", "base_hashes": {"ROADMAP.md": "…"},
            "verdict": {"ok": true, "errors": 0, "notes": 2, "tasks_before": 6, "tasks_after": 6, "app_files_changed": 0},
            "original_in_trash": ".trash/2026-10-19T14-38/"}}
```

## Walkthrough (one Given/When/Then per story)

1. **Diagnose** — Given Pong's ROADMAP.md lists two tasks as 004 and is saved — When I press "Show Plan Check" — Then the "Plan Check" panel lists "Two different tasks are numbered 004" at "ROADMAP.md:10–11", and Work shows ROADMAP.md with line 10 marked.
2. **Repair needs Planning** — Given Discussion — When I look at "Ask Pi to Repair…" — Then it is disabled with "Repairs write ROADMAP.md and tasks/, which only Planning allows." and "Change Phase…".
3. **Choose identity** — Given the 004 finding — When I choose "“Ball speeds up” keeps 004" and press "Use This" — Then the settled line reads "004 stays “Ball speeds up”; “Score display” becomes 006 in the repair" and no file changed.
4. **Repair and review** — Given Planning and the choice — When I press "Ask Pi to Repair…" then "Review Changes…" — Then "Review the plan repair" shows 4 changed files and "Check passed"; "Apply Repair" writes them; the done row offers "Restore Original…".
5. **Failure keeps the original** — Given the harness check fails on the proposal — Then "The repair didn’t pass the check" and "Not applied" show, and ROADMAP.md is byte-for-byte unchanged.
6. **Stale repair** — Given a ready repair and I save ROADMAP.md in Work — When I press "Apply Repair" — Then "ROADMAP.md changed while the repair was prepared" shows, my edit is kept, and "Check Again" runs a fresh check.
7. **Reload** — Given a ready repair — When I reload — Then "Plan repair ready to review" is still there with "Review Changes…".
8. **Second tab** — Given Pong open in two Workbench tabs — When I apply in one — Then the other's Plan Check shows "No problems" after its next check, and its open review reads "ROADMAP.md changed while the repair was prepared".
9. **Restore** — Given a repaired plan — When I press "Restore Original…" then "Restore Original" — Then the files are back as at 14:31 and the repaired ones are in the project's Trash.

## Open product choices

- Renumbering takes the next free number (006), not a suffix (004a); or only fix ROADMAP links and keep file names.
- "They are the same task" needs a merge rule for steps and history (proposed: both lists kept under one heading, nothing removed).
- Where the original is kept: the project Trash (proposed) vs git only.
- Whether Run on its own may apply a repair that passed the check (proposed: no; Apply Repair is a person control).
- The ⌃⌥. / ⌃⌥, next/previous finding keys.

## Don't

- Don't diagnose from text pasted in the chat; read the saved file.
- Don't renumber, merge or drop a task without the person's choice; don't treat a repeated identical link as two tasks.
- Don't check a Red step or invent a past failing test to "fix" an evidence gap.
- Don't write the repair before the review, over a newer edit, or after a failed validation; don't trust Pi's "done" without the harness verdict.
- Don't edit app files, make the check block chat or editing, or ask the person how the agent should proceed.
