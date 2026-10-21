# RecordingHistory

The window that lists recorded flows, with **WorkStation**, **Preview** and **outside projects** kept apart, each flow's end, gap or truncation said honestly, and read-only inspection (round 19, owner-delegated 21 Oct 2026; brief section B). Boards: R19_RecHistory, R19_RecResponsive (320 px, Inverse), R19_RecEvidence (Clear, Trash, Restore). Design only.

Why a card: round 15 had no place to see recorded flows except inside a message; round 19 needs history separated by surface and bucket, inspection, Clear by exact scope and the Trash.

## Where it opens

Recording History… in the WorkStation popover, the Preview popover, Settings › Recording, and the phone recording sheet. Title “Recording History · {project}” (from a project window) or “Recording History · outside projects”.

## Anatomy

- `section.pw-window[aria-label="Recording History"]`, infobar “Kept on Aiko's MacBook · 7 days · at most 20 flows each” · “Inspecting never runs anything”.
- `div.pw-rechist` with three `section.pw-rechist__group` (each `aria-labelledby` its `h3.pw-rechist__title`, `.pw-rechist__note` with the count “6 of 20 flows”): **WorkStation · {project}**, **Preview · {project}**, **WorkStation · outside projects** (“Overview, Projects, Settings · never attached on its own”). Other projects are not listed here; open their own history.
- Each group: `ul.pw-rechist__list[role=listbox]` of `li.pw-recsess[role=option]`: `.pw-recsess__what` (window · view: “This window · Chat”, “Phone · Chat”, “Preview · this window”), `.pw-recsess__when` (“14:31–now · 42 steps”), `.pw-recsess__state` (Recording · Ended: switched project · Ended: Preview closed · Ended by a restart · Truncated (dotted) · Gap 13:03 (dotted)), optional `.pw-recsess__note`.
- Foot `.pw-rechist__foot`: **Inspect** · **Attach to Message…** · **Clear…** · **Trash**.
- Inspect opens the flow read-only (FlowAttachment's step list with `.pw-flow__limits`); selecting a step never runs it.
- 320 px / phone: `.pw-rechist--narrow` puts the time under the name.

## States

| State | What shows |
| --- | --- |
| Idle | the three groups, newest first |
| Loading | “Loading recordings…” in each group (polite once); controls disabled |
| Empty | per group: “No WorkStation flows for Class Notes.” / “WorkStation recording is off. Record WorkStation…” (not enabled) |
| Error | “Couldn't load recordings from Aiko's MacBook. Try Again.” — chat and work unaffected |
| Disabled | Attach to Message… disabled with no flow selected; Clear… disabled when the scope is empty |
| Stale | a flow cleared or expired in another window leaves with one polite line; the selection moves to the next row |
| Conflict | Not applicable: history is read-only; Clear and Restore are idempotent on the host |
| Access lost | flows of a project no longer open are not listed; restored ones stay hidden |

## Clear, Trash, Restore

Clear… names its exact scope (radio list), then the alert “Move {project}'s WorkStation recordings to the Trash?” (Cancel default). Pending capture cannot refill cleared history; late batches are refused. Trash lists cleared flows; **Restore** (元に戻す) returns them without restarting recording and rechecks access. Sent reports and messages keep their copies (said in the alert). No permanent delete, no new retention.

## Who may invoke, persistence, focus

- The signed-in person, for their own flows; project groups only for projects they may open. Calls use normal authentication and project authorization.
- Flows live on the host; the window keeps nothing in browser storage.
- Focus starts on the first row of the first non-empty group; ↑↓ move within a group, Tab moves between groups and the foot; Return = Inspect; Esc closes and returns focus to Recording History….

## Texts

| English | 日本語 |
| --- | --- |
| Recording History · {project} | 記録の履歴 · {project} |
| WorkStation · outside projects | WorkStation · プロジェクト外 |
| Inspecting never runs anything | 確認しても何も実行しません |
| Recording / Ended / Ended by a restart / Truncated / Gap {time} | 記録中 / 終了 / 再起動で終了 / 打ち切り / {time} に記録なし |
| Inspect / Attach to Message… / Clear… / Trash / Restore | 確認 / メッセージに添付… / 消去… / ゴミ箱 / 元に戻す |

## Don't

- Don't merge the three groups or show outside-project flows inside a project's group.
- Don't show a gap or truncated flow as complete.
- Don't run, replay or “test” a step from inspection.

## Walkthrough (Given / When / Then)

1. **Separated** · Given flows in Class Notes (WorkStation and Preview) and in Overview · When “Recording History…” · Then three groups list them apart, with counts.
2. **Honest ends** · Given a flow cut by a restart and one past its limit · Then “Ended by a restart” and “Truncated” show with their notes.
3. **Clear and restore** · When “Clear…”, “Class Notes · WorkStation”, “Move to Trash”, then Trash › “Restore” · Then the flows return and the WorkStation button still reads what it read before.
4. **Reload and second window** · Given the window open in two browser windows · When one clears · Then the other drops the rows with one polite line.
