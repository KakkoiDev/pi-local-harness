# 71: Pi Workbench System 1, menu bar

Kind: code

Request 2026-10-13: "implement this new design." Build step 4 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 5 Menus).

- [x] Red (`tests/browser/chat.cjs`): with no project, File › New Page… is disabled and New Project… enabled; status reads `Ready`; File opens with Return, focus on New Project…, Down/Up move, Return opens `#folder-dialog` and closes the menu; Edit › Find in Files… disabled outside Work; Right switches to View; Esc closes and returns focus to the title; ⌘1-⌘4 switch views; Project menu lists projects as `menuitemradio`, checked = current, choosing one switches; Project › Open Project Chat; ⌥⌘R and the ruler button hide and show Review.
- [x] `js/menubar.mjs` (served, allowlisted): menubar pattern (roving tab stop, click/Return/Space/Down/Up open, pointer-over switches while open, Left/Right, Home/End, Esc, Tab), 80 ms flash via `data-active` (skipped under reduced motion), focus returns to where it was before the menu opened, one `keydown` shortcut listener (⌘ on macOS, Ctrl elsewhere, matched on `event.code` so ⌥ letters work, ignored during IME composition).
- [x] `js/chat.mjs`: `commands` table and `enabled()` per § 5. A command without a handler shows disabled: settings, about, desktop pattern, open on phone (steps 5, 11, 12), comment/ask selection, resolved comments, next/previous comment (step 8), cancel waiting (step 5), task record (step 9), event info (step 10).
- [x] Shortcuts that are disabled are not prevented, so the browser's own ⌘F, ⌘⌫ in a field, ⌘Z/X/C/V/A keep working. ⌘W cannot be intercepted in Chrome (it closes the tab); the menu item works.
- [x] `js/workspace.mjs`: its own ⌘K and ⌘S listeners removed (now commands); `status()`, `selectProject`, `saveNow` exported; `#agent-state` is a glyph and a word: `Ready`, `Working · N waiting`, `N waiting`, `Connection interrupted`.
- [x] Review window open/closed is `body[data-review]`, persisted as `plh.review`.
- [x] Bug found in self-review and covered by the first red check: `when[command] ?? true` enabled commands whose condition was `null` (no project).
