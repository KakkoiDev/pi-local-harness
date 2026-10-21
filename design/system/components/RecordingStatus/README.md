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

## Round 19 (decided, owner-delegated 21 Oct 2026)

Brief `design/briefs/round-19-final-integration.md`, section B. Recording covers **both surfaces**: Pi WorkStation and the Preview. Boards: R19_RecFirstUse, R19_RecSurfaces, R19_RecControl, R19_RecStop, R19_RecStates, R19_RecSessions, R19_Rec1024, R19_RecResponsive, R19_RecStrings, R19_RecWalk, Ph19_RecFirstUse, Ph19_RecStatus, Ph19_RecOverview. Capture lives in test-core; storage, permissions and presentation in WorkStation. Recording is evidence collection, never a grant of agent authority. Design only: nothing here claims the runtime exists.

Settled from the round 15 open choices: the Preview stays **on by default per project** (unchanged, now always labelled); retention is **7 days, at most 20 flows**, per project, and the same limits separately for WorkStation per project and for a WorkStation-only **outside projects** history; “recent” stays 30 minutes. WorkStation recording is **off until the person presses Enable Recording**.

### Two buttons, one per surface

- **WorkStation:** `button.pw-recstat.pw-recstat--bar#ws-recording-status` in the menu bar, left of the agent status (one per browser window, so it sits over Projects, the project chat, Work/files, Settings and Overview; no extra toolbar slot in Overview). `aria-controls="ws-recording-popover"`. Text names the surface and where this window's steps go: “Recording WorkStation · Class Notes” / “· outside projects”. The destination is fixed per step at event time by the desk window it happened in (project window → that project; Overview, Projects, Settings → outside projects); the button shows the active window's destination. 1024: “Recording WorkStation” (destination stays in the accessible name). Long names ellipsize at 340 px.
- **Preview:** the round 15 button keeps its place; its words now name the surface: “Recording Preview · 9 steps”, “Preview not recording”, “Preview not recording · app stopped”, “Preview can't be recorded”, “Preview recording paused”, “Starting Preview recording…”.
- **Phone:** `div.pw-recbar` (44 px) under the phone bar from the moment WorkStation recording is enabled (on or off); it opens the sheet “Pi WorkStation recording”. Before enabling, the switch is in π › Settings… and the first-use sheet.
- Neither button ever claims the other's state.

### First use (WorkStation)

A one-time HarnessNotice (role=note, no focus move) in the Projects window: “New: Pi WorkStation can record what you do in its windows, so Pi can see what led to a problem. It stays off until you turn it on.” · Recording Options… · Not Now. Pressing the WorkStation button (or Recording Options…, or Record WorkStation later) opens the dialog `#wsrec-first` “Record what you do in Pi WorkStation?” (Kept · Never kept · Where · How long; the Preview's own setting named) with **Not Now** (default, Esc) and **Enable Recording**. The choice is kept per person on the host (“locally”: on the computer running Pi WorkStation, not in browser storage). Nothing is captured before Enable.

### Popover `#ws-recording-popover`

Title “Recording Pi WorkStation · this window”; `.pw-recpop__scope` (Kept with: Class Notes, this window's project · Overview, Projects and Settings: outside projects, a separate history · This flow: since 14:31 · 42 steps); the facts; `.pw-recpop__other` showing the Preview's state; one help line. Buttons: **Stop Recording WorkStation** (on) / **Record WorkStation** (off) / **Try Again** (paused, lost) · **Stop All Recording** · **Recording History…** · **Report a Problem…**. Remote device (any browser that is not the host): “Recordings are kept on Aiko's MacBook, the computer running Pi WorkStation: not on this phone, not in a cloud service.” The Preview popover's Stop Recording becomes **Stop Recording Preview** and gains **Stop All Recording** and **Recording History…**.

### States

| State | WorkStation text | Preview text | Notes |
| --- | --- | --- | --- |
| Idle, never enabled / Not Now / stopped | WorkStation not recording | Preview not recording | Preview off only when the person stopped it |
| Loading (initializing) | Starting WorkStation recording… | Starting Preview recording… | until the host opens a session / the bridge handshake answers; never “Recording” before it is true (`.pw-recstat--init`) |
| On | Recording WorkStation · {project} | Recording Preview · {n} steps | |
| Empty | Recording WorkStation · {project} (popover: “This flow: no steps yet”) | Recording Preview · no steps yet | |
| Error: storage full/failing | WorkStation recording paused | Preview recording paused | notice + Try Again; chats, answers and saves unaffected |
| Error: transport lost | WorkStation recording · not connected | (Preview follows the page) | `.pw-recstat--lost`; in-flight steps delivered only if the flow is still open, else a gap |
| Stale / unknown | WorkStation recording status unknown | — | host hasn't confirmed; never shown as on (`.pw-recstat--unknown`) |
| Unavailable | — | Preview can't be recorded | unsupported or injection-blocked page; never “on” (`.pw-recstat--unavailable`) |
| Disabled | Not applicable: the button is never disabled; when the host is unreachable it opens the popover with the not-connected text | | |
| Conflict | Stop in another window wins: mirrored to every window of the person; announced once “WorkStation recording stopped in another window.” | | |
| Reproduction | Recording a reproduction · WorkStation | Recording a reproduction · Preview | ProblemReport |

Restart: “Pi WorkStation restarted at 14:41. The flow before it ended there; recording continues in a new flow (recording again since 14:42).” Quota: oldest flow removed, said as “the limit, not a failure”.

### Who may invoke, persistence, cancellation, focus

- Enable Recording / Not Now / Stop / Record WorkStation: the signed-in person, for their own WorkStation recording. Preview switch: a person who may open the project. Stop All Recording: the signed-in person; stops their WorkStation recording and every Preview recording they can open; deletes nothing, starts nothing. All calls go through normal authentication and project authorization.
- Persistence: the enable/stop choice and the flows live on the host (per person; per project or outside projects). Nothing in browser persistent storage.
- Cancellation: Not Now cancels the first use; Esc closes the popover without change. Stop is immediate and not undoable (Record WorkStation starts a new session).
- Focus: Esc/Tab-out returns focus to the button that opened the popover; Stop keeps focus on the same button; Stop All closes the popover and returns focus to the WorkStation button; toasts are polite and never focused.

### Keyboard and screen readers

Tab reaches the WorkStation button in the menu bar's status area before the agent status; Space/Return opens; Tab/⇧Tab inside; Esc closes. State changes are announced once through the button's name; steps are never announced; reduced motion: no animation (initializing is a dotted dot). The recorder only listens and never moves focus.

### Texts (round 19)

| English | 日本語 |
| --- | --- |
| Recording WorkStation · {project} | WorkStation を記録中 · {project} |
| Recording WorkStation · outside projects | WorkStation を記録中 · プロジェクト外 |
| WorkStation not recording | WorkStation は記録していません |
| Starting WorkStation recording… | WorkStation の記録を開始中… |
| WorkStation recording paused | WorkStation の記録を一時停止中 |
| WorkStation recording · not connected | WorkStation の記録 · 接続していません |
| WorkStation recording status unknown | WorkStation の記録状態は不明 |
| Recording Preview · {n} steps | Preview を記録中 · {n} ステップ |
| Preview not recording | Preview は記録していません |
| Preview can't be recorded | Preview は記録できません |
| Record what you do in Pi WorkStation? | Pi WorkStation での操作を記録しますか？ |
| Enable Recording / Not Now | 記録を有効にする / 今はしない |
| Stop Recording WorkStation / Stop Recording Preview / Stop All Recording | WorkStation の記録を止める / Preview の記録を止める / すべての記録を止める |
| Record WorkStation / Recording History… | WorkStation を記録 / 記録の履歴… |
| WorkStation recording stopped. The Preview is still recording. | WorkStation の記録を止めました。Preview は記録を続けています。 |
| All recording stopped. What was recorded is kept. | すべての記録を止めました。記録済みの内容は残っています。 |

Full list: R19_RecStrings. No native-speaker review claimed.

### Changed text (round 15 → round 19)

- Preview button “Recording · {n} steps” → “Recording Preview · {n} steps”; “Not recording” → “Preview not recording”; “Not recording · app stopped” → “Preview not recording · app stopped”; “Can't record this page” → “Preview can't be recorded” (popover keeps the reason); accessible name “Recording on: 9 steps from this project…” → “Recording Preview on: 9 steps from Class Notes. Recording options”.
- Preview popover “Stop Recording” → “Stop Recording Preview”; adds Stop All Recording and Recording History….
- “Open product choices” of round 15: settled as above (Superseded: “On by default (drawn) or off until turned on” — the Preview stays on; WorkStation is off until enabled).

### Walkthrough (round 19)

1. **Enable** · Given a person who never decided · When “WorkStation not recording”, then “Enable Recording” · Then “Starting WorkStation recording…”, then “Recording WorkStation · Class Notes”; nothing before Enable.
2. **Decline and reload** · Given the first-use dialog · When “Not Now”, then reload · Then nothing is recorded and the button still reads “WorkStation not recording”.
3. **Stop one, keyboard** · Given both surfaces recording · When Tab to the WorkStation button, Space, Return on “Stop Recording WorkStation” · Then the Preview still reads “Recording Preview · 9 steps”.
4. **Stop all, two windows** · Given two windows · When “Stop All Recording” in one · Then both surfaces read not recording in both; the other window announces once; history kept.
5. **Unknown is not on** · Given the host stops confirming · Then “WorkStation recording status unknown”, never “Recording WorkStation”.

### Follow-up decisions (21 Oct)

Decision record `design/briefs/round-19-follow-up-decisions.md`, decisions 8, 9, 10, 12. Boards: R19_RecLimits, R19_RecIdentity, Ph19_RecOptIn, Ph19_RecSettings, R19_RecResponsive (theme wrappers), R19_RecStates.

- **Limits (8):** at most 500 normalized events per flow, 50 per batch, 64 KiB per encoded HTTP body, checked by the host before storage; 20 flows / 7 days per bucket unchanged. A full flow accepts nothing more: new state `data-state="full"` `.pw-recstat--full` “WorkStation flow full · 500 steps” (JA “WorkStation の記録が上限 · 500 ステップ”), accessible name “WorkStation flow full: 500 steps; later steps in this flow are not kept. Recording options”; popover title “This flow is full” with “This flow reached 500 steps at 14:29. Steps after that aren't kept and nothing earlier was removed. A new flow starts with a new session: reload, a project change, Stop then Record WorkStation, or Record It Again…”. No eviction, no automatic replacement flow; batching never creates flows. An oversized batch is rejected whole and becomes a gap (FlowAttachment); capture continues. Superseded: round 19's unspecified “limit reached” wording.
- **Phone opt-in (9):** Settings › Recording “Record what I do in Pi WorkStation” (off; turning it on opens the first-use sheet first) plus the one-time notice above the chat (Recording Options… · Not Now, 44 px buttons). Not Now dismisses it for good on every device of that identity; normal use is unaffected. Nothing is captured before Enable (the Enable tap itself isn't recorded). Consent and decline are mirrored across the identity's windows; announced once “WorkStation recording was turned on in another window.” (JA “別のウインドウで WorkStation の記録がオンになりました。”). The Preview's own default stays visible and separately switchable.
- **Identity (10):** `p.pw-recwho` in the popover: signed in “For: Aiko, signed in. Your choice and history are yours on Aiko's MacBook.”; without a person “For: Shared profile on this computer. This browser isn't signed in as a person, so Pi WorkStation can't tell people apart: anyone using this profile shares its recording choice and history.” (JA “このコンピューターの共有プロフィール” …). The shared profile starts off until enabled for that profile. A profile/session switch closes all capture in that window and clears client buffers; notice “Signed in as Aiko. Recording for the shared profile ended in this window, and steps not yet sent were cleared. …” / “Signed out. Recording for Aiko ended in this window, and steps not yet sent were cleared. …”. No events or preferences cross identities; no account system is added.
- **Theme wrappers (12):** boards and previews load `round19_theme.css`, so an open button (`aria-expanded=true`) inside a `[data-theme]` wrapper uses that wrapper's selection colours; dark and light drawn side by side in R19_RecResponsive.

| State (new) | Text | Who may invoke | Focus |
| --- | --- | --- | --- |
| Flow full | WorkStation flow full · 500 steps | Stop / Stop All / Record It Again…: the person | popover first button; Esc back to the button |
| Shared profile, off | WorkStation not recording (popover names the profile) | anyone using the shared profile | as before |
| Identity switch | (button resets to that identity's state) | sign-in / sign-out only | focus unchanged; one polite notice |

Persistence: limits and identity are host rules; nothing in browser storage; buffers cleared on switch. Cancellation: Not Now on the notice; Esc everywhere.

Walkthrough: **Full flow** · Given a flow with 500 steps · When more events arrive · Then none are kept, the button reads “WorkStation flow full · 500 steps”, History “Truncated · 500 steps”. **Phone opt-in** · Given a phone that never decided · When “Not Now”, later Settings › the switch, then “Enable Recording” · Then the notice is gone everywhere, nothing was captured before Enable, the desk window follows. **Shared profile** · Given a browser not signed in · When the popover opens · Then it names “Shared profile on this computer” and recording is off. **Switch** · Given shared-profile recording with pending steps · When Aiko signs in · Then capture closes, pending steps are cleared, Aiko's own choice applies.
