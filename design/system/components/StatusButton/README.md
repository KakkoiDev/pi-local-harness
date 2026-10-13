# StatusButton

The agent status at the right of the menu bar, as a button that opens **Activity · All Projects** (⌘3). It reads as status first: at rest it has no frame, only the glyph and the words.

- Markup: `<button id="agent-status" class="pw-statusbtn" aria-keyshortcuts="Meta+3" aria-label="Agent status: Working, 1 waiting. Open Activity">` holding the StatusGlyph, `<span id="agent-state" role="status">Working · 1 waiting</span>` and `<span class="pw-statusbtn__more">` (the `back` icon mirrored, 10px). The live region is the inner span, so the button's name is not re-announced on every poll.
- States: **rest** (no frame; › hidden) · **hover** (1px ink frame, › shown) · **pressed** (`:active`, inverted like an open menu title) · **attention** (`.pw-statusbtn--attention`: a failed, stopped or interrupted request; caution glyph, framed with `shadow-popup`, › always shown, words "Stopped · 1 needs attention"). Attention clears when Activity is opened.
- Words: Ready · Working · Working · 1 waiting · Stopped · 1 needs attention · Connection interrupted (then the button opens nothing and a Reconnect button follows it).
- Height 22px inside the 28px bar; 44px on phone, where it sits at the right of the PhoneBar.
- CSS: `.pw-statusbtn`, `.pw-statusbtn__more`, `.pw-statusbtn--attention`, `[data-state]` for previews only.
