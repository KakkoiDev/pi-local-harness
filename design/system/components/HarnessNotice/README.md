# HarnessNotice · CutLine · DecisionRow

Three quiet lines under an answer (round 12, tasks 290–291, plan 267). Boards: R12_Conversation, R12_Fixes, Ph12_Cut.

## HarnessNotice `.pw-notice`

A dotted box, `role="note"`: info glyph, **Harness** (or **Suggested**, **Restored**), the sentence, an optional link. It is the harness speaking, never Pi's voice. Examples: “Laya isn't installed, so the phase button can't suggest the next phase. Everything else works. How to Install”; the theme hint “The Theme panel can do this without Pi… Open Radius…”.

## CutLine `.pw-cut`

Under an answer that stopped before Pi finished, `role="status"`: ■ “Stopped by you before Pi finished. · 14:22” or the stop glyph “Failed before Pi finished: the model stopped answering (no reply in 120 s).” Then **Retry** (default) and **Undo This Request…**. The partial answer stays above it.

## DecisionRow `details.pw-decisions`

Collapsed under an answer: “▸ 5 decisions · 2 automatic”. Open: one row per decision, a source tag (you · auto · Laya · code · model; auto and model dotted), the name, the value, **Change…**. Change… opens a ChoiceCard that names what it redoes. Settings › Detail: Beginner hides decisions made by code; Expert shows all with paths and commands. Terminal: `/decisions`.

## Phone

Rows and the summary are 44 px; the cut line's buttons are touch size.

## Round 15: recording notices (task 333)

New harness notices, all non-blocking, each with one action: first use in the Preview (“This Preview records which buttons and pages you use (never what you type)…” What's Kept · Stop Recording · OK), no recent flow (“No recent Preview actions to attach…” Record It Again…), expired (“…older than 7 days and were removed.”), delivery failure (“The Preview actions couldn't be attached… Your message was sent without them.” Attach Again), storage failure (“Recording paused: Pi Workbench can't save to its data folder… The app, your messages and your answers work as before.” Try Again), test draft saved. Japanese: “ハーネス” as the speaker. See RecordingStatus, FlowAttachment, ProblemReport.
