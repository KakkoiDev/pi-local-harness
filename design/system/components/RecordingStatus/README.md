# RecordingStatus

Shows, in the Preview foot, whether this project's Preview actions are being recorded, and opens what is kept, Stop Recording, Clear History… and Report a Problem… (round 15, task 333). Boards: R15_Recording, R15_RecordingStates, R15_Reproduce, R15_Recording1024, Ph15_Recording, Ph15_Reproduce.

## Decision: on by default, per project, always visible

Recording is **on** for each project from its first Preview, with a one-time HarnessNotice in the Preview (“This Preview records which buttons and pages you use (never what you type)…” · What's Kept · Stop Recording · OK). Why: the moment a person says “it didn't work” is after the fact; only structure and character counts are kept; the state is always on screen. **Open product choice for the owner:** off until turned on (then the first report starts with Record It Again…).

## Anatomy

- `button.pw-recstat#recording-status` in `.pw-preview__foot`, after Stop/Start, `data-state="on|off|paused|repro"`, `aria-haspopup="dialog" aria-expanded aria-controls="recording-popover"`. The dot is filled while recording, hollow when not; paused has a dotted border. Its accessible name says the state and the step count: “Recording on: 9 steps from this project. Recording options”.
- Desk: `section.pw-recpop#recording-popover role="dialog" aria-label="Recording"` above the button: a title, `dl.pw-facts` (Kept · Not kept · Where · How long), one help line (“Pi gets these steps only when you report a problem in the chat or with Report a Problem…”), then **Stop Recording** (or **Record This Preview**, or **Try Again** when paused) · **Clear History…** · **Report a Problem…**. Phone: the same as a sheet “Recording”, buttons stacked at 44 px.
- Reproduction: `div.pw-repro role="status" aria-live="polite"` under the Preview toolbar: “Recording a reproduction · 3 steps so far. Do what goes wrong, then press Done.” **Cancel** · **Done**.

## States

| State | Button text | Popover / note |
| --- | --- | --- |
| On, no steps | Recording · no steps yet | as on |
| On, flow available | Recording · {n} steps | Stop Recording |
| Off (person stopped it) | Not recording | Record This Preview |
| App stopped / starting / crashed | Not recording · app stopped | “Recording starts again with the app.” |
| Terminal app | Not recording · terminal app | “Terminal apps aren't recorded.” |
| Unsupported page (PDF, file, another site) | Can't record this page | says why; the app's own pages record again |
| Storage failure | Recording paused | “Can't save to Pi Workbench's data folder (disk full). The app works as before.” Try Again |
| Reproduction | Recording · {n} steps (`repro`) | the banner; Done / Cancel |
| Expired history | Recording · no steps yet | a HarnessNotice when a report finds nothing: “…older than 7 days and were removed.” Record It Again… |

Retention: on this Mac, with this project only, 7 days, at most 20 flows (oldest removed first). **Clear History…** asks “Move this project's recorded Preview actions to the Trash?” (Cancel default · Move to Trash) and uses the project's Trash. Disable: Project › Settings… “Record what I do in the Preview” (the same switch as Stop Recording). A failure never stops the app, a message or an answer.

## Texts

| English | 日本語 |
| --- | --- |
| Recording · {n} steps | 記録中 · {n} ステップ |
| Recording · no steps yet | 記録中 · まだ操作はありません |
| Not recording | 記録していません |
| Not recording · app stopped | 記録していません · アプリは停止中 |
| Not recording · terminal app | 記録していません · ターミナルアプリ |
| Can't record this page | このページは記録できません |
| Recording paused | 記録を一時停止中 |
| Stop Recording / Record This Preview | 記録を止める / この Preview を記録 |
| Clear History… / Report a Problem… | 履歴を消去… / 問題を報告… |
| Recording a reproduction | 再現を記録中 |
| Move this project's recorded Preview actions to the Trash? | このプロジェクトで記録した Preview の操作をゴミ箱に移しますか？ |
| Record what I do in the Preview | Preview での操作を記録する |

## Keyboard and focus

- Tab order in the foot: Stop → Recording status → Open in Browser. Space/Return opens the popover with focus on its first button; Esc closes and returns focus to the status; Tab past the last button closes it.
- The banner's Done is focused when the reproduction starts; Done or Cancel returns focus to what opened Record It Again… (the chat notice, the report dialog).
- Live: state changes are announced once through the button's name; the banner is `aria-live="polite"` and updates at most every 5 steps.

## Don't

- Don't draw a checkbox that recovers text typed earlier: it was never kept. Show “(text not recorded)”.
- Don't say “all sensitive data removed”; list what is kept and not kept.
- Don't hide the status when off, and don't let recording ask a question or block anything.

## Walkthrough (Given / When / Then)

1. **Visible from first use** · Given a project whose app runs in the Preview for the first time · When the Preview opens · Then the notice and the button “Recording on: 0 steps from this project. Recording options” show; “OK” hides the notice for this project.
2. **Stop** · Given recording is on · When the person presses “Recording options”, then “Stop Recording” · Then the button reads “Not recording”, and Project › Settings… shows the switch off.
3. **Clear** · Given 12 flows · When “Clear History…”, then “Move to Trash” · Then the button reads “Recording · no steps yet” and the flows are in the project's Trash.
4. **A failure doesn't block** · Given saving fails · When the person answers a waiting question · Then the answer is sent and the button reads “Recording paused”.
5. **Reload and second tab** · Given two Workbench tabs on Class Notes · When recording is stopped in one and the other reloads · Then both read “Not recording”.

## Open product choices

- On by default (drawn) or off until turned on.
- Retention: 7 days and 20 flows are proposals; the owner may set others.
