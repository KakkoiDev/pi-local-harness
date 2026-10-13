# 120: Back up the design artifacts in the repo

Kind: chore

Request 2026-10-13: "I also want to backup the 2 artifacts I linked with the design system and the html files on the gh repo."

- [x] Missing pieces added: the design system's 26 icon uploads (`design/system/assets/Icons/*.svg`, checked to be plain SVG) and the canvas stylesheet upload (`design/canvas/_blob/…css`); boards, index, cards, tokens were already copied (task 111).
- [x] `design/view.py` serves the boards locally; the canvas runtime stays out of git (artifact-type code, public repo; `.gitignore`).
- [x] Checked: W_NoPlan renders from the repo copy. Green: unittest (naming test covers the copies).
- [x] design/README.md § Backup.
