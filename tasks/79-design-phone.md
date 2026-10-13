# 79: Pi Workbench System 1, Phone

Kind: code

Request 2026-10-13: "implement this new design." Build step 12 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 10 Phone).

- [x] Red (`tests/browser/chat.cjs`): at 390px the menu bar and view tabs hide and the phone bar shows; views switch through `#phone-view-menu`; Work: ‹ Files gives the Files screen, a file returns to the document, ‹ Files replaces π there, Comments N opens the Review sheet and the backdrop closes it; the π sheet has Settings… (opens `#settings-dialog`); Activity and Laya rows open a detail screen and ‹ back returns; at 320 and 390, every visible button and select in all four views is at least 44px tall and nothing scrolls sideways. The older 320/390 checks switch views through the popup.
- [x] `index.html`: `#phone-back`, `#phone-comments`, `#phone-view-menu` (Chat, Work, Activity with its count, Laya), Settings… and About Pi Workbench in the π sheet.
- [x] `js/chat.mjs`: `phoneBar()` sets `body[data-pane]`, the back label, π versus back, and Comments N; runs from `showView` and `controls`; the view popup uses `installPopup`; `menu(false)` also closes the Review sheet.
- [x] `js/workspace.mjs`: hooks `documentOpened` (also when the open file is tapped again) and `jobOpened`; a pointer press no longer re-renders the Activity table on focus, which swallowed the row's click.
- [x] `chat.css`: view tabs hide; Activity detail and Laya Event Info are full screens; the π sheet opens in Work too; Close window and Zoom hide; sheet close boxes, table rows and file rows are 44px; the selection bar sits at the bottom.
- [x] `design/components.css` and the Popup README: popups are 44px on phone.
- Differs from the spec: Activity and Laya keep the popup filter, not the segmented filter of [Ph_Activity] and [Ph_Laya].
- Not tested: the selection bar on a real phone, safe-area insets, Offline banner on phone, About from the π sheet.
