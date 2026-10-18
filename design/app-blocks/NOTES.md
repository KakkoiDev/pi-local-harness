# App Blocks: in this repo

This folder is the backup of two claude.ai artifacts by the designer (round 12 part A, plan 266 item 7). It is reference for the apps Pi generates; the workbench does not serve it. `README.md` here is the designer's own text, copied unchanged.

## Where the files come from

- Design system "App Blocks", https://claude.ai/artifact/YJF3Sy1VXEuREgWLxskKwP: its `project/` folder, copied to this folder (`project/README.md` is `README.md`, then `tokens.json`, `design-system.json` and `components/`, 137 cards plus `Cover`, `bundle.css` and `lib/`). Not copied: `index.html`, `SKILL.md` and `artifact-type/`, which are the Design System type's runtime, not the designer's work (`SKILL.md` describes itself as part of that runtime and is byte for byte the same file the Pi Workbench system artifact carries).
- "Blocks Playground", https://claude.ai/artifact/W4WRB3B7tPMYv3VxN8Rpqa: all 15 files, copied to `demo/` (`index.html`, `app.css`, `js/main.js`, `js/kit.js`, `js/apps/{notes,shop,admin,chat,board,game}.js`, `lib/`). It is the designer's own page, not an artifact type, so its `index.html` is kept. The page loads Silkscreen and DotGothic16 from Google Fonts; everything else is local.

Synced on 2026-10-18 (design system version 1792299069-363e, playground version 1792301240-089b).

## The vendored libraries in `components/lib/` and `demo/lib/`

Both `lib/` folders hold the same five files (same sha256).

| File | sha256 | Matches the kit's copy |
| --- | --- | --- |
| `chart.umd.min.js` (Chart.js 4.5.1, MIT) | `48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a` | yes, `kit/vendor/chartjs-4.5.1/chart.umd.min.js` |
| `chart.LICENSE.md` | `41a84aa2…34d4cce` | yes, `kit/vendor/chartjs-4.5.1/LICENSE.md` |
| `basecoat.all.min.js` (Basecoat 1.0.2, MIT) | `bdb364d43e0f3e7b8dfcfa27bbbe8baac96249e57b79e7f0d241bf70b056ea98` | yes, `kit/vendor/basecoat-1.0.2/js/all.min.js` (renamed) |
| `basecoat.chart.min.js` (Basecoat 1.0.2, MIT) | `4e82a2bc45d8ae9f5fc74341d38e71b6bfd4d691075f0cd08fd8ed6b01feff5c` | yes, `kit/vendor/basecoat-1.0.2/js/chart.min.js` (renamed) |
| `basecoat.LICENSE.md` | `160a6cea…ace78` | yes, `kit/vendor/basecoat-1.0.2/LICENSE.md` |

`basecoat.chart.min.js` is Basecoat's own chart wrapper (`basecoat.chart()`), shipped in the basecoat-css 1.0.2 npm package as `dist/js/chart.min.js` (the package exports it as `basecoat-css/chart.min`). It needs Chart.js loaded first. No library here differs from the vendored copies, so nothing new enters the kit's licence list.

## Mapping

The workbench copies map the checker's old name to Gate (task 96). App Blocks has no such use; nothing was changed in these files.

## After a sync

Pi does not read this folder: `python3 kit/blocks/build.py` turns `components/*/README.md` into the cards in
`kit/blocks/` (plan 266 item 7, task 317), and `tests/test_app_blocks.py` fails until it is run. This folder is not
installed with the harness (`harness/install.py`).
