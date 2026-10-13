# 95: Buttons and view tabs stay inside their window

Kind: code

Request 2026-10-13: "on a little bit of the breakpoints, the layout is a little dirty, if not easy to fix don't risk to break other things" (screenshots: New Task… past the Files window edge; view tabs past the main window into Review).

Measured (761-1440px, every 10px): two overflows, nothing else.
- 761-1100 (tablet), Work: Files window 220px, row 198px; New Page… + New Task… need 227px.
- 1101-1140, Work (Files 290 + Review 380) and Laya with Event Info: main window 335px at 1101; view tabs need 373px.

- [x] Red (`tests/browser/chat.cjs`): at every desktop/tablet width, no `.pw-btn` or `.pw-seg` crosses its window edge; 1101px added to the widths. Failed on `new-task` at 768 before the fix.
- [x] `chat.css` tablet block: `.window-files` 256px.
- [x] `chat.css` 1101-1140: `.view-tabs kbd` hidden. The menus still show ⌘1-⌘4.
- Not changed: the 1100px breakpoint. Moving it to 1140 would float Review over the document in every view.
- Not tested: Projects window (Chat/Activity/Laya) at widths between the scanned ones; the scan found no overflow there.
