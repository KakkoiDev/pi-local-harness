# 94: Show resolved checkbox sits beside its label

Kind: code

Request 2026-10-13: "is this layout correct?" (screenshot: the Review window's checkbox centred above "Show resolved in the text"). No. `.window-section` sets `flex-direction:column`; `.pw-label-row` on the same element never reset it.

- [x] Red (`tests/browser/chat.cjs`): the checkbox is at the label's left edge, vertically centred on the text, and the row is at most 48px tall. Fails with the fix stashed.
- [x] `chat.css` `.pw-label-row`: `flex-direction:row`.
- Checked: the only other checkbox row, Settings › Return sends, uses `.settings-option` (a row already).
