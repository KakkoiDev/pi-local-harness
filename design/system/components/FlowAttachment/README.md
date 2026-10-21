# FlowAttachment

The recent Preview actions of this project, attached by the workbench under the person's message when they report a problem in ordinary chat, inspectable and removable (round 15, task 333). Boards: R15_FlowContext, R15_Recording1024, R15_RecordingStates (320 px), Ph15_FlowContext.

## When it appears

System 1 (code + classifier) attaches it when a message reports a problem with the app (“the button didn't work”, “動かない”) and this project has a recorded flow from the last 30 minutes. Only this project's flow; never another project's, never harness chats. If there is none, the message is sent as it is and a HarnessNotice says so: “No recent Preview actions to attach: the last ones are from 13:02. Your message was sent without them.” Record It Again…

## Anatomy

- `details.pw-flow` right under the message, `aria-label="Preview actions attached to your message"`. Summary: ▸/▾, “Preview actions”, “14:21–14:22 · 9 steps · attached by the workbench”, Hide. Closed by default after the first time.
- Open: `ol` of steps, each `li` with number, time (mono) and the step in words by place: “Clicked the 1st button in the 1st form”, “Typed 12 characters there *(text not recorded)*”, “Page loaded *(address not recorded)*”. Then `.pw-flow__kept` “Kept out: what you typed, labels, addresses, password fields, other projects, other chats.” and the model line: on this Mac “Model on this Mac (gemma4:12b): the steps stay here.”; online “The selected model is online (…): these steps go to it with your message, as your messages do.”
- Foot: **Report a Problem…** · **Save as Test Draft…** · **Remove from Message**.
- 320 px and phone: `.pw-flow--narrow` / the phone media query put the time over the step; buttons wrap.

## States

| State | What changes |
| --- | --- |
| Attached | as above; Pi's answer may refer to step numbers |
| Removed | the attachment disappears from the message and from what Pi received; the message stays |
| Delivery failure | HarnessNotice: “The Preview actions couldn't be attached (the recording service didn't answer). Your message was sent without them.” Attach Again |
| Save as Test Draft… | Planning or Implementation only (disabled in Discussion: “Writing a test needs Planning or Implementation (⌃⌥P).”). Writes `tests/replay/<date>-<name>.test.mjs`; notice: “It fails on purpose until you write what should happen (line 18). Typed values are stand-ins.” |
| Reproduction attached to a draft | “The new steps are attached to your draft. Send it when you're ready.” |

## Texts

| English | 日本語 |
| --- | --- |
| Preview actions | Preview の操作 |
| {range} · {n} steps · attached by the workbench | {range} · {n} ステップ · ワークベンチが添付 |
| (text not recorded) / (address not recorded) | （文字は記録していません）/（アドレスは記録していません） |
| Kept out: … | 残していないもの：… |
| Report a Problem… / Save as Test Draft… / Remove from Message | 問題を報告… / テストの下書きとして保存… / 添付を外す |

## Keyboard and focus

Summary is a button (Space/Return toggles). Order: summary → steps (not focusable) → Report a Problem… → Save as Test Draft… → Remove from Message. After Remove, focus moves to the message.

## Data

`{"project": "class-notes", "from": "14:21:05", "to": "14:22:18", "steps": [{"t": "14:21:22", "kind": "click", "target": "form:nth-of-type(1) button:nth-of-type(1)"}, {"kind": "input", "target": "form:nth-of-type(1) input:nth-of-type(1)", "length": 12}], "viewport": "phone", "lang": "en", "commit": "3f2a1c4"}` — structural selectors and lengths only (test-core recorder).

## Don't

- Don't show or promise typed text, labels, ids, error text or full addresses.
- Don't attach a flow from another project, or block sending when none is available.
- Don't call a test draft proof that the app works.

## Walkthrough (Given / When / Then)

1. **This project only** · Given 9 steps in Class Notes and 4 in another project · When the person sends “The Add button didn't work.” in Class Notes · Then “Preview actions attached to your message” lists 9 steps.
2. **Remove** · Given the attachment · When “Remove from Message” · Then it is gone and Pi's next answer does not use it.
3. **No flow** · Given recording is off · When the person sends “動かない” · Then the message is sent and the notice offers “Record It Again…”.
4. **Delivery failure** · Given the recorder doesn't answer · When the message is sent · Then it is sent without the steps, with “Attach Again”.
5. **Reload** · Given an attached message · When the Workbench reloads · Then the attachment still opens with the same steps.

## Open product choices

- The 30-minute window for “recent”.
- Whether System 1 also attaches on a plain question about a screen (not a reported problem).

## Round 19 (decided, owner-delegated 21 Oct 2026)

Brief section B. Boards: R19_RecCoverage, R19_RecAttach, R19_RecEvidence, R19_RecSessions, Ph19_RecAttach. A message may now carry flows from **both surfaces**: Preview and WorkStation. Design only.

### What attaches, and how

- **Automatic** (round 15 rule, kept): only this project's recent flows (Preview, and WorkStation if enabled) when System 1 classifies the message as reporting a problem. Never outside-project flows, never another project's flows.
- **Deliberate:** “Attach recordings” (from Attach…, the attachment foot's “Attach More…”, or Recording History's “Attach to Message…”): dialog `aria-labelledby="pick-title"`, `p.pw-destline` “Destination: Class Notes · this chat's draft. Attaching sends nothing; you send the message.”, then `fieldset.pw-evidence` with `p.pw-evgroup` headings: Class Notes · Preview (checked), Class Notes · WorkStation (checked), Outside projects · WorkStation (**unchecked**, “only if you choose it”), Other projects (**unchecked**, only projects the person can open). A live count “2 flows · 16 steps · to Class Notes”. Cancel · **Attach to Draft** (default). Attaching puts `.pw-chip`s on the draft; nothing is sent.
- Each step row may carry `span.pw-flow__src` (Preview / WorkStation) when one attachment mixes surfaces; `p.pw-flow__gap` says a gap or truncation; `p.pw-flow__limits` says what isn't covered.

### Removal

- **Before Send:** the chip's ✕ (`aria-label="Remove {name}"`) leaves it out of that submission.
- **After Send:** Remove from Message hides it and adds: “Removed from this message. Pi already received these steps with your message at 14:23 and its answer may use them; removing them here can't take that back. Later requests won't include them.” (JA: R19_RecStrings.)

### States

| State | What shows |
| --- | --- |
| Idle | the summary line, closed |
| Loading | Not applicable: the steps come from the host with the message; a missing flow is “Missing” below |
| Empty | Not applicable: an empty flow is never attached (round 15 notice offers Record It Again…) |
| Missing / unavailable | “These steps are no longer available (cleared or expired).” — no step list, never reconstructed |
| Stale | the list as recorded, with “Recorded 14:21–14:22” (never re-read live) |
| Truncated / gap | `.pw-flow__gap` lines |
| Access lost (restored or revoked project) | steps hidden: “This flow is from a project you can no longer open, so its steps stay hidden.” |
| Disabled | Save as Test Draft… in Discussion (round 15) |
| Conflict | Not applicable: attachments are per message |

Inspection is read-only; selecting a step never runs anything. Save as Test Draft… still writes a failing draft needing assertions and normal phase/verification rules; a journey is not a passing test.

### Focus

Attach recordings opens with focus on the first checkbox; Cancel/Esc returns to the control that opened it; Attach to Draft returns focus to the composer field. After Remove from Message focus moves to the message (round 15).

### Walkthrough (round 19)

1. **Outside never auto-attaches** · Given Overview steps from 14:18 and Class Notes steps from 14:20 · When “The Add button didn't work.” is sent in Class Notes · Then only Class Notes' flows are attached.
2. **Deliberate mixed selection** · When “Attach recordings”, check “This window · Overview”, “Attach to Draft” · Then the draft shows three chips and nothing is sent.
3. **Remove before / after** · as above; after Send the note says it can't be taken back.

### Follow-up decisions (21 Oct)

Decisions 8 and 11. Boards: R19_RecLimits, R19_RecTestDrafts.

- **Gap from an oversized batch (8):** a batch over 50 events or 64 KiB is rejected whole by the host; the step list shows `p.pw-flow__gap` “{from}–{to} · Some steps couldn't be kept (too many at once). Recording continues.” (JA “一度に多すぎたため、一部の操作を残せませんでした。記録は続いています。”) and later steps continue under it with continuous numbering. **Full flow:** the last line reads “Truncated · 500 steps: this flow is full since 14:29. Later steps in it were not kept; the first 500 are all here.” (JA “打ち切り · 500 ステップ”). Earlier steps are never evicted.
- **Test drafts (11):** Save as Test Draft… appears only on a flow whose steps all come from the Preview. On a mixed or WorkStation-only flow the button is **absent** (not disabled) and the flow's details say “Test drafts are available for Preview steps only.” (JA “テストの下書きは Preview の操作だけで作れます。”). Such flows stay inspectable and attachable. Test drafts fail until an outcome is written, follow the phase gates (Discussion: disabled, round 15 reason) and never replay anything; a capture is never a passing test. Superseded: round 19's line “Save as Test Draft… still writes a failing draft…” applies to Preview-only flows only.

Focus: unchanged (the absent button simply isn't in the Tab order). Walkthrough: **Mixed flow** · Given a flow with Preview and WorkStation steps · When it opens · Then no Save as Test Draft…, and the reason line shows. **Gap then capture** · Given an oversized batch at 14:20:11 · Then the gap line shows and steps 4–6 follow it.
