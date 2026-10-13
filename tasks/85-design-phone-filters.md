# 85: Pi Workbench System 1, phone segmented filters

Kind: code

Request 2026-10-13: "finish now", pointing at the deviation listed after task 79: "Activity and Laya kept a dropdown filter instead of the segmented control." Spec: [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 10 "Activity and Laya: list screens with a segmented filter [Ph_Activity], [Ph_Laya]". Labels from the canvases: All, Active 2, Attention 3, Done; All, Before, After, Problems.

- [x] Red (`tests/browser/chat.cjs`, 390px): `#activity-filter` is hidden; the Show radiogroup reads All, Active, Attention, Done; Done sets the filter to `completed`, is checked, and lists only completed jobs; Left moves to Attention; All resets. Laya reads All, Before, After, Problems; Problems sets `failures`. At 1440px the segmented control is hidden. Fails with the implementation stashed.
- [x] `index.html`: `#activity-seg` and `#laya-seg` (`.pw-seg--fill.phone-filter`, `role=radiogroup`) before the desk Show popups (`.desk-filter`).
- [x] `js/ui.mjs` `segmentFor(seg, select)`: the select stays the state, so `openJob` and Show in Laya, which set the select, stay in sync through the render functions.
- [x] `js/workspace.mjs`: Active and Attention carry counts for the chosen project, as the canvas shows.
- [x] `chat.css`: segmented control only below 761px, popup only above.
- [x] Marked the old deviations in tasks 74, 76, 77 and 79 with dated notes.
- Not tested: counts in the labels (the test strips them); touch target and overflow checks at 320/390px pass with the control present.
