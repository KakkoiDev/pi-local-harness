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
