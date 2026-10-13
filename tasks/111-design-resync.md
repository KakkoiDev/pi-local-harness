# 111: Re-sync the design copies

Kind: chore

Request 2026-10-13: "don't be lazy, really check if you are matching the provided design." The repo copies in `design/` predated the designer's Plan/Files work (ListGroup, W_NoPlan, W_Tablet, C_WorkDesk `noplan`/`search` states, Ph_Files segmented control) and the system-font switch.

- [x] `design/canvas/`: every board from the canvas artifact, old checker name mapped to Gate as in task 96; new W_NoPlan, W_Tablet.
- [x] `design/system/`: README, tokens, design-system.json, bundle.css, ListRow, ListGroup from the system artifact; the repo's implementation notes in InlineThread, Menu, Popup, SegmentedControl, ToolCall READMEs kept.
- [x] `design/components.css`: rebuilt from the new bundle (adds `.pw-group*`, `.pw-row--summary`, meta glyph spacing) plus the four repo additions; `design/README.md` records them.
- [x] Green: unittest, node --test, browser suite (320-1440px).
- Boards render locally for comparison: canvas `artifact-type/dc-runtime.js` served as `support.js` beside the boards, the system stylesheet asset at `/_blob/5e247b7487a244ef2ab08d4d7de05685`.
