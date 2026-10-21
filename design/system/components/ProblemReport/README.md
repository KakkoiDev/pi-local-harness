# ProblemReport

**Report a Problem…**: a local report draft about the app, with every included item named and removable; preparing, saving a draft, asking Pi and submitting are four different actions (round 15, task 333). Boards: R15_ReportReview, R15_ReportFailure, R15_Reproduce, R15_ReproStart, Ph15_ReportReview.

## Where it lives

- Help › **Report a Problem…** (desk menu bar; no shortcut).
- The RecordingStatus popover and the FlowAttachment foot.
- Phone: the Preview view menu and the recording sheet.
Opening it sends nothing anywhere.

## Anatomy (desk dialog 620 px; phone full sheet with Cancel in its head)

1. **What went wrong** (`#report-what`, required; filled from the chat message when opened from one).
2. **What you expected (optional)** (`#report-expected`).
3. `fieldset.pw-evidence` “Included with the report”: one `label.pw-evrow` per item, a checkbox and a `small` line saying what it holds: Preview actions · {range} · {n} steps (Inspect) · Preview size and language · App version (commit, task) · The app's last 40 lines of output (**unchecked** by default; Show Lines to read first).
4. `.pw-never` “Never included: your chats with Pi, other projects, passwords and keys, what you typed.”
5. Where it goes, in words. Buttons: **Cancel** · **Save Draft** · **Submit to GitHub…** · **Ask Pi About It** (default).

| Action | What it does |
| --- | --- |
| Save Draft | keeps the report in Pi Workbench's data on this Mac, with this project (not in the project's files); “Draft saved · Report a Problem · 14:27” Open Draft · Delete Draft… |
| Ask Pi About It | puts the report into this chat as a message with its FlowAttachment; it follows the model's usual data policy |
| Submit to GitHub… | only when the project has a GitHub repository and `gh` is signed in; asks first: “Open an issue in {owner/repo} on GitHub?” naming what GitHub will show and that a public repository is public; Cancel (default) · Open Issue |

## States

| State | What changes |
| --- | --- |
| Preparing | fields and evidence as above |
| No flow / too old | the Preview actions row is disabled with “The recorded steps end at 13:02, before you saw the problem.” and **Record It Again…** |
| Record It Again… | dialog: Cancel · Start Recording; the Preview shows the reproduction banner; Done returns here (or to the chat's draft) with the new flow; the chat's draft, attachments and waiting question are kept |
| Typed text in a new recording | **Proposed, not settled:** “Also keep what I type during this recording”, unchecked, this recording only, password/key fields never; needs a privacy review before it is built |
| Draft saved | the done line; reopen from Help › Report a Problem… |
| Submit unavailable | the button stays, disabled, with its reason: “Submit needs a GitHub repository for this project.” · “Not signed in to GitHub on this Mac (gh auth login).” · “Offline.” |
| Submit failed | alert line “Couldn't open the issue: GitHub didn't answer within 20 seconds. Your report is saved as a draft.” Try Again |
| Submitted | “Issue #14 opened on GitHub · 14:31” View on GitHub |

## Texts

| English | 日本語 |
| --- | --- |
| Report a Problem… | 問題を報告… |
| What went wrong | 何が起きましたか |
| What you expected (optional) | 期待していたこと（任意） |
| Included with the report | レポートに含めるもの |
| Never included: your chats with Pi, other projects, passwords and keys, what you typed. | 含めないもの：Pi とのチャット、ほかのプロジェクト、パスワードやキー、入力した文字。 |
| Save Draft / Ask Pi About It / Submit to GitHub… | 下書きを保存 / Pi に相談 / GitHub に送信… |
| Open an issue in {repo} on GitHub? | {repo} に GitHub の issue を作成しますか？ |
| Open Issue | issue を作成 |
| Issue #{n} opened on GitHub | GitHub に issue #{n} を作成しました |
| Draft saved | 下書きを保存しました |
| Record It Again… / Start Recording / Done | もう一度記録… / 記録を開始 / 完了 |

## Keyboard and focus

Focus starts in What went wrong. Tab: What went wrong → What you expected → each evidence checkbox and its link → Cancel → Save Draft → Submit → Ask Pi About It. Esc = Cancel (keeps nothing unsaved; asks only if the person typed: “Keep this report as a draft?” Don't Keep · Save Draft). The confirmation's Cancel is the default. After Submit, focus returns to the dialog's result line.

## Walkthrough (Given / When / Then)

1. **Draft stays local** · Given Class Notes with a 9-step flow · When the person opens “Report a Problem…” and presses “Save Draft” · Then “Draft saved” shows and no network request is made.
2. **Submit asks first** · Given a draft and a GitHub repository · When “Submit to GitHub…” · Then the alert names the repository; “Cancel” sends nothing; “Open Issue” shows “Issue #14 opened on GitHub”.
3. **Submit fails** · Given GitHub doesn't answer · When “Open Issue” · Then “Try Again” shows and the draft remains.
4. **Record again keeps the chat** · Given a chat draft and a waiting question · When “Record It Again…”, “Start Recording”, “Done” · Then the draft text, its attachment and the question are unchanged.
5. **Reload and second tab** · Given a saved draft · When the Workbench reloads in a second tab · Then Help › Report a Problem… lists the draft once.

## Open product choices

- Default on vs off for recording (this card draws on).
- Whether typed text may ever be kept in a new reproduction (drawn as proposed only).
- Report destinations beyond GitHub; whether drafts expire with the flow history (7 days) or stay until deleted.

## Don't

- Don't submit anything on open, on Save Draft or on Ask Pi.
- Don't include the app output unless the person checks it.
- Don't add a policy question (“How should Pi proceed…?”).

## Round 19 (decided, owner-delegated 21 Oct 2026)

Brief section B. Boards: R19_RecEvidence, R19_RecStates, Ph19_RecReport. Design only.

### Evidence from both surfaces

The evidence fieldset lists Preview and WorkStation flows of the destination project separately (WorkStation only if enabled); “Choose Recordings…” opens the same Attach recordings list as FlowAttachment (outside-project and other-project flows unchecked, destination named).

### Record It Again… (mixed surfaces)

The start dialog gains “Record in”: ☑ The Preview of Class Notes · ☑ Pi WorkStation · this window (disabled with “WorkStation recording is off. Enable Recording… explains it first.” when not enabled) and `p.pw-destline` “Destination: Class Notes · this chat's draft (not sent)”. Each surface gets a **new** flow only for the reproduction. Banner: “Recording a reproduction · WorkStation” + “Preview and WorkStation · 5 steps so far…”; Done focused. **Done** attaches both new flows to the draft, unsent: “The new steps are attached to your draft: Preview · 4 steps and WorkStation · 3 steps. Nothing was sent; send it when you're ready.” **Cancel**: “Reproduction cancelled: nothing attached, your draft unchanged. Recording is back as it was.” Drafts, attachments and waiting questions are preserved either way. Superseded (round 15): “Also keep what I type during this recording” — not drawn in round 19; typed text is never stored.

### External report: redacted payload first

Submit to GitHub… now opens “Review what GitHub will receive” (`aria-labelledby="ext-title"`): `p.pw-destline` (repository, public or private), `pre.pw-payload` with the **exact** redacted text (scrolls; `<mark>` marks redactions), “This is the exact text, already redacted. Nothing else is sent…”, then Back · **Cancel** (default) · Open Issue. This replaces the round 15 confirmation alert as the confirming step (Superseded: “Open an issue in {repo} on GitHub?” alert — its words move into the destination line). Failure: “Couldn't open the issue: GitHub didn't answer within 20 seconds. Your report is saved as a draft. Check GitHub before trying again in case it arrived.” Try Again.

### Clear (from Recording History or the recording popovers)

“Clear Recordings” names its exact scope (Class Notes · WorkStation · 6 flows / Class Notes · Preview / both / Outside projects · WorkStation) → alert “Move Class Notes' WorkStation recordings to the Trash?” with “…Recording goes on; steps still on their way are not kept. Copies already sent stay where they are: 2 messages in this chat and issue #14 on GitHub keep their steps.” Cancel (default) · Move to Trash → toast “6 flows moved to the Trash.” Undo. Restore from the Trash never restarts recording (“6 flows restored. Recording wasn't restarted…”) and applies current access (flows of a project no longer open stay hidden).

### States

| State | What changes |
| --- | --- |
| Idle / preparing | as round 15 |
| Loading | “Opening the issue…” on Open Issue (busy, disabled); Esc does nothing until it returns |
| Empty | no flow: the row is disabled with Record It Again… (round 15) |
| Error | failed send (above); recorder failures never block the report or chat |
| Disabled | Submit unavailable reasons (round 15); WorkStation row disabled when not enabled |
| Stale | a flow cleared or expired after the report opened: its row reads “no longer available” and is unchecked |
| Conflict | Not applicable: one report per dialog; drafts are separate items |

Who may invoke: the signed-in person with access to the project; Submit also needs the project's repository and `gh` signed in. Persistence: report drafts on the host with the project (round 15). Focus: Review opens on the payload (`tabindex=0`); Cancel/Back return to the report dialog's Submit button.

### Walkthrough (round 19)

1. **Redacted text first** · Given a report with Preview and WorkStation flows · When “Submit to GitHub…” · Then the exact text shows with “(text not recorded)” marks, the public repository is named, Cancel is the default.
2. **Reproduce both, Done** · Given a draft and a waiting question · When “Record It Again…”, “Start Recording”, “Done” · Then two new flows are attached unsent; the question still waits.
3. **Clear by scope, restore** · When “Clear…” on Class Notes · WorkStation, “Move to Trash”, then “Restore” · Then the flows return, recording is not restarted, sent copies were never touched.
