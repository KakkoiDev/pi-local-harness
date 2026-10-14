# design/

Everything about the Pi Workbench System 1 interface lives here: the source design, the CSS and icons the app serves, and the build instructions. Read in this order:

1. [../DESIGN.md](../DESIGN.md): the ten rules every UI change must respect.
2. [IMPLEMENTATION.md](IMPLEMENTATION.md): how the workbench (`index.html`, `chat.css`, `js/*.mjs`) moves to this design. Ids, menus, commands, states, dialogs, data, phone, test changes, build order (§ 12), acceptance checklist (§ 13).
3. [system/README.md](system/README.md): the design system itself: principles, copy rules, colour, type, spacing, iconography, and one card per component.

## What is served and what is reference

| Path | Served by the app? | What it is |
| --- | --- | --- |
| `tokens.css` | yes, `/design/tokens.css` | Colours, fonts (`@font-face` to `/fonts/`), spacing, sizes. Paper theme by default; Inverse under `html[data-theme="dark"]` or `data-appearance="system"` + OS dark. |
| `components.css` | yes, `/design/components.css` | The `pw-*` component classes. Same as `system/components/bundle.css` minus the Google Fonts import. Both carry one repo fix: closed `dialog.pw-dialog` stays hidden (task 70). |
| `icons.mjs` | yes, `/design/icons.mjs` (imported by `js/ui.mjs` as `../design/icons.mjs`) | 1-bit icons, `icon()`, `hydrateIcons()`, `stateGlyph()`, the `STATES` vocabulary (glyph + word per job state and Gate outcome). |
| `layout.css` | no | Page layout for the new markup. Build step 3 copies it into `/chat.css`. |
| `index.reference.html` | no | Target markup with every existing id kept and new ids marked. Build step 3 copies it into `/index.html`. |
| `system/` | no | Design system source: `tokens.json`, `design-system.json`, `components/<Name>/{README.md,preview.html}`, `assets/Icons/README.md`. Previews load Google Fonts; they are for reading in a browser, not for the app. |
| `canvas/` | no | Design canvas source: one `*.dc.html` artboard per screen or state, `canvas.json` for page order. IMPLEMENTATION.md cites artboards as **[Board name]**, e.g. [W_Trash] is `canvas/W_Trash.dc.html`. |

The server allowlist is in `harness/web_chat.py` (`allowed` in `do_GET`, plus `FONTS`). Anything not listed there returns 404. `harness/install.py` copies `design/` and `fonts/` into the installed package.

## Backup of the two artifacts

This folder is the backup of both claude.ai artifacts, for everything their authors wrote:

- Design canvas: every board `canvas/*.dc.html`, the index `canvas/canvas.json`, and its uploaded stylesheet `canvas/_blob/df76a9fabeae28600b25f9b7ca37501f.css` (the boards link it as `/_blob/<id>`).
- Design system: `IMPLEMENTATION.md` (the designer keeps it in the system artifact as `project/IMPLEMENTATION.md`; it lives at `design/IMPLEMENTATION.md`), `system/README.md`, `tokens.json`, `design-system.json`, every component card (`components/<Name>/README.md`, `preview.html`), `components/bundle.css`, and the 27 icon uploads as `system/assets/Icons/*.svg` (names from `design-system.json`; `gate.svg` added in round 3).
- The old checker name is mapped to Gate in the copies (task 96).

Not backed up: each artifact's `index.html`, `artifact-type/` files and runtime. They belong to the claude.ai artifact types, not to this project, and this repo is public. To look at the boards locally, save the canvas artifact's `artifact-type/dc-runtime.js` as `canvas/support.js` (git ignores it) and run `python3 design/view.py`.

## Where the originals are

- Design system "Pi Workbench System 1": https://claude.ai/artifact/JrBZmw41xj2wXGSFiDxmB1
- Design canvas "Pi Workbench, Desktop Interface": https://claude.ai/artifact/Re2trGpSgYLrd2anCHTRyK

The copies here are from 2026-10-14 12:30 JST (re-synced for task 154: project commands in the Project menu, the phone ⋯ on project rows; before that task 149: round 4). `components.css` keeps four repo additions over the bundle: `.pw-menu--sub` (desk and phone), the expanded submenu item, the 44px phone popup, and the closed-dialog fix. If the artifacts change, re-export into `system/` and `canvas/` and re-check every document derived from them (this file, IMPLEMENTATION.md, DESIGN.md).

## Progress

One task file per build step, starting at [tasks/68-design-foundations.md](../tasks/68-design-foundations.md); the "Pi Workbench System 1" section of [ROADMAP.md](../ROADMAP.md) lists them.
