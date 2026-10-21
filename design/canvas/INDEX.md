# Canvas index

All board files (`*.dc.html`) live in this folder. Two claude.ai Design canvases show them, each from its own manifest. A canvas holds at most 511 files per version, so round 19 starts a second canvas (round 19 follow-up decision 14, `design/briefs/round-19-follow-up-decisions.md`). Nothing was deleted, archived or pruned from the first canvas. The round 19 closeout repaired alert icons on 25 of its boards in place and refreshed 8 addendum boards; its manifest did not change.

| Canvas | Manifest | Rounds and pages | Boards | Shared stylesheet |
| --- | --- | --- | --- | --- |
| Pi Workbench — Desktop Interface (https://claude.ai/artifact/Re2trGpSgYLrd2anCHTRyK) | `canvas.json` | Screens, Workflows, Terminal, App preview, every menu and state, phone pages; rounds 8–18; the round 18 addendum (retitled settled or superseded by round 19); Edit & comment; Components; Archive | 484 | `_blob/0a58a7bd56eede27d7d5c52f8a4dd6da.css` |
| Pi WorkStation — Round 19 onward (https://claude.ai/artifact/SxRVdR5LZ76Ur1TeFcKjeZ) | `canvas-round19.json` | Round 19 in four pages: Overview, status and selection · Ask across projects, drafts and Trash · Project chat · Recording on WorkStation and Preview | 62 (`R19_*`, `Ph19_*`) | `_blob/6b8d723e397cc49af3680173bfa74436.css`, the same bytes copied into the second canvas |

- The first canvas is **not** synchronized with round 19 and does not list the `R19_`/`Ph19_` boards.
- Later rounds go on the second canvas, or on a further canvas listed here when that one fills up.
- Both canvases install the design system "Pi Workbench System 1" as `ds/piworkbench/tokens.json`.
- To view a board locally, follow `design/view.py`: open `http://127.0.0.1:8765/<Board>.dc.html`. Both blob files are in `_blob/`.
