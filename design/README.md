# design/

Everything about the Pi Workbench System 1 interface lives here: the source design, the CSS and icons the app serves, and the build instructions. Read in this order:

1. [../DESIGN.md](../DESIGN.md): the ten rules every UI change must respect.
2. [IMPLEMENTATION.md](IMPLEMENTATION.md): how the workbench (`index.html`, `chat.css`, `js/*.mjs`) moves to this design. Ids, menus, commands, states, dialogs, data, phone, test changes, build order (§ 12), acceptance checklist (§ 13).
3. [system/README.md](system/README.md): the design system itself: principles, copy rules, colour, type, spacing, iconography, and one card per component.

## What is served and what is reference

| Path | Served by the app? | What it is |
| --- | --- | --- |
| `tokens.css` | yes, `/design/tokens.css` | Colours, fonts (`@font-face` to `/fonts/`), spacing, sizes. Paper theme by default; Inverse under `html[data-theme="dark"]` or `data-appearance="system"` + OS dark. |
| `components.css` | yes, `/design/components.css` | The `pw-*` component classes. Same as `system/components/bundle.css` minus the Google Fonts import, plus the repo additions listed below (among them the closed-dialog fix, task 70: closed `dialog.pw-dialog` stays hidden); bundle.css is a straight copy of the designer's. |
| `icons.mjs` | yes, `/design/icons.mjs` (imported by `js/ui.mjs` as `../design/icons.mjs`) | 1-bit icons, `icon()`, `hydrateIcons()`, `stateGlyph()`, the `STATES` vocabulary (glyph + word per job state and Gate outcome). |
| `layout.css` | no | Page layout for the new markup. Build step 3 copies it into `/chat.css`. |
| `index.reference.html` | no | Target markup with every existing id kept and new ids marked. Build step 3 copies it into `/index.html`. |
| `system/` | no | Design system source: `tokens.json`, `design-system.json`, `components/<Name>/{README.md,preview.html}`, `assets/Icons/README.md`. Previews load Google Fonts; they are for reading in a browser, not for the app. |
| `canvas/` | no | Design canvas source: one `*.dc.html` artboard per screen or state, `canvas.json` for page order. IMPLEMENTATION.md cites artboards as **[Board name]**, e.g. [W_Trash] is `canvas/W_Trash.dc.html`. |

The server allowlist is in `harness/web_chat.py` (`allowed` in `do_GET`, plus `FONTS`). Anything not listed there returns 404. `harness/install.py` copies `design/` and `fonts/` into the installed package.

## Backup of the two artifacts

This folder is the backup of both claude.ai artifacts, for everything their authors wrote:

- Design canvas: every board `canvas/*.dc.html`, the index `canvas/canvas.json`, and its uploaded stylesheet `canvas/_blob/0a58a7bd56eede27d7d5c52f8a4dd6da.css` (the boards link it as `/_blob/<id>`). The canvas also carries a snapshot of the design system’s tokens, `canvas/ds/piworkbench/tokens.json`; it is older than `system/tokens.json` (its chrome face is still Pixelify Sans), so `system/tokens.json` is the source.
- Design system: `IMPLEMENTATION.md` (the designer keeps it in the system artifact as `project/IMPLEMENTATION.md`; it lives at `design/IMPLEMENTATION.md`), `system/README.md`, `tokens.json`, `design-system.json`, every component card (`components/<Name>/README.md`, `preview.html`), `components/bundle.css`, and the 28 icon uploads as `system/assets/Icons/*.svg` (names from `design-system.json`; `gate.svg` added in round 3, `more.svg` in round 5).
- The old checker name is mapped to Gate in the copies (task 96).

Not backed up: each artifact's `index.html`, `artifact-type/` files and runtime. They belong to the claude.ai artifact types, not to this project, and this repo is public. To look at the boards locally, save the canvas artifact's `artifact-type/dc-runtime.js` as `canvas/support.js` (git ignores it) and run `python3 design/view.py`.

## Where the originals are

- Design system "Pi Workbench System 1": https://claude.ai/artifact/JrBZmw41xj2wXGSFiDxmB1
- Design canvas "Pi Workbench, Desktop Interface": https://claude.ai/artifact/Re2trGpSgYLrd2anCHTRyK

The copies here are from 2026-10-17 08:31 JST (re-synced: round 11, three phases for every request (task 247) and context reasons (task 234): the "Phases" page (R11_* boards, Ph11_* boards, T_Phases), opening with its answers board R11_Answers; the new PhaseControl card and the round 11 sections in the PlanCard, CheckInCard, ContextLine, AwayCard and TerminalOutput cards; the round 11 block at the end of the bundle (`.pw-phase`, `.pw-phase-menu`, `.pw-phase-line`, `.pw-waiting`, `.pw-tool__reason`, `.pw-why`, `.pw-context__why`, `.pw-reasons`), appended to `components.css`; IMPLEMENTATION.md's round 11 section and its "Changed round 10 text" list; earlier, 2026-10-16 08:38 JST: rounds 9 and 10, plan 236: the "Updates & devices" page (R9_*, Ph9_* boards) and the "Plan mode" page (R10_*, Ph10_* boards, T_PlanMode), each opening with its answers board; the ChoiceCard, PlanCard, CheckInCard and AwayCard cards and their `.pw-card` styles in the bundle; IMPLEMENTATION.md rounds 9 and 10 and round 10 version 2; Settings and Check for Updates… in the Dialog card, the π and Agent menu changes in the MenuBar and PhoneBar cards; Compact Now, New Conversation and Earlier Conversations boards moved to the Archive page; earlier, 2026-10-15 17:58 JST: the missing Ph_Done board (the phone done row), the round 7 New Project… section in the Dialog card, Preview ⌥⌘P in the MenuBar card's Window menu, and the canvas's design-system snapshot `canvas/ds/piworkbench/tokens.json`; earlier the same day, round 8's Phone parity, task 222: the Ph8_* boards, IMPLEMENTATION.md round 8, the PhoneBar, Sheet and Menu cards; earlier, round 7's App preview, task 206: P_* boards, PreviewWindow, DoneRow, the Radio, New Project kinds, the undo alerts; earlier, task 177: the Terminal boards redrawn with the repo's names, Show/Hide Task Record and its phone sheet, four thinking levels; earlier: round 5, task 163: Activity back buttons by origin, request links, WorkerCard, Dictate, model capability and not installed, raw block, `more` icon, Rename Project errors in the dialog). `components.css` keeps four repo additions over the bundle: `.pw-menu--sub` (desk and phone), the expanded submenu item, the 44px phone popup, and the closed-dialog fix. If the artifacts change, re-export into `system/` and `canvas/` and re-check every document derived from them (this file, IMPLEMENTATION.md, DESIGN.md).

## Progress

One task file per build step, starting at [tasks/68-design-foundations.md](../tasks/68-design-foundations.md); the "Pi Workbench System 1" section of [ROADMAP.md](../ROADMAP.md) lists them.
