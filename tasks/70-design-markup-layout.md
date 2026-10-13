# 70: Pi Workbench System 1, markup and layout

Kind: code

Request 2026-10-13: "implement this new design." Build step 3 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12.

- [x] Red (`tests/browser/chat.cjs`): `body[data-view]` follows the tab; `#window-title` is the project name in Chat, the file name in Work, `Activity`, `Laya`; the window holding focus is active (`.pw-window--inactive` on the others); text files hide the Review window, Markdown shows it; the phone π sheet is hidden, not just slid off-screen.
- [x] Copy changed by the design, test names updated: "Create Your First Project…", "Add Comment", "Send Request".
- [x] `index.html` = `design/index.reference.html` minus its header comment, plus `hidden` on the empty `#event-info` (otherwise it takes 340px and crushes the Laya view to 0 width; step 10 shows it on selection).
- [x] `chat.css` = `design/layout.css` plus:
  - `[hidden]{display:none!important}`, carried over from the old CSS. Without it `body[data-view="work"] [data-view-only="work"]{display:flex}` outranks `.window-review[hidden]` and the Review window shows for text files.
  - `#main-window{min-width:320px}` and `#desk{overflow-x:auto}`: at 768px Files (290) + Review (380) + gaps leave the main window 0px wide. The desk scrolls sideways instead. Open with the user: a real tablet layout.
  - `#project-folder` ellipsis: a long path overflowed 390px.
  - Phone: `#workspace-bar` stays (shortcut hints hidden) until step 12 builds the phone-view popup; hiding it now would leave no way to change views on the phone.
  - A "Legacy" section for `.block-tools` until step 7 replaces them.
- [x] `design/components.css` and `design/system/components/bundle.css`: `dialog.pw-dialog:not([open]){display:none}`. `.pw-dialog{display:flex}` showed closed dialogs over the page.
- [x] `js/chat.mjs` `showView`: sets `body.dataset.view`, View menu `aria-checked`, `#phone-view-label`, `#window-title`; `MutationObserver`s on `#document-name` and `#active-project-label` keep the title in step; one `focusin` listener on `#desk` toggles `.pw-window--inactive`.
- [x] Revert check: old `chat.mjs` with the new markup fails the browser test (Review window never shows without `data-view`).
- Interim, fixed by later steps: menu titles do nothing (step 4); messages, files, Activity and Laya rows still use the old classes and look plain (steps 6-10).
