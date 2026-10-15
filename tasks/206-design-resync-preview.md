# 206: Re-sync the design after round 7's App preview

Kind: chore

Request 2026-10-15: the designer drew the App preview page from the brief (design/briefs/app-preview.md) and redrew
it to match what is built (tasks 200–205); IMPLEMENTATION.md "Round 7" and "Round 7 update" (points 1–13).

- [x] `design/canvas/`: the App preview boards (P_Answers, P_Beside, P_Changed, P_DoneParts, P_Error, P_Fixing,
  P_Full, P_Japanese, P_Narrow, P_NewProject, P_NewProjectStatic, P_NotStarted, P_NotWeb, P_OnPhone, P_Starting,
  P_Tablet, P_Undo, P_UndoConflict, P_UndoUnsaved, P_Undone, Ph_Preview, Ph_PreviewMenu), C_MenuBar, canvas.json.
- [x] `design/system/`: PreviewWindow and DoneRow cards, bundle.css (the round 7 block: `.pw-preview*`, `.pw-address`,
  `.pw-done*`, `.pw-lesson*`, `.pw-radio`, `.pw-choice`, `.pw-lines`), design-system.json, tokens.json, README;
  `design/IMPLEMENTATION.md`.
- [x] `design/components.css`: the round 7 block appended, as in the bundle.
- [x] The build is split: 207 the Preview window, 208 the done row and the undo alerts, 209 New Project kinds and
  the Radio, 210 Open on Phone and the phone view, 211 lesson lines.
