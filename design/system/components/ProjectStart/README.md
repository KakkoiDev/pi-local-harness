# ProjectStart

New Project (plan 253): a four-step dialog, **Name → Capabilities → Packages → Summary**, so Pi starts from a tested base and builds only what makes the app different. Also **Project › Add a Capability…** for later. Boards: canvas page **Project Start & fixes** (R12_NP1–NP4, R12_AddCap, Ph12_NP2–NP4).

## Layout (desk)

- `div.pw-dialog role="dialog" aria-label="New Project"`, 860 × 760 px: title row, then a 180 px step list `ol.pw-steps` (`aria-current="step"` on the current one, `data-done` adds ✓), the step body (scrolls), and the action row: **Back** · status text · **Next** (default); the last step **Cancel** · **Create** (default).
- **1 Name**: Name, Create in (popup), “What is it, in a sentence? (optional)” and the way out, **Start from an empty folder instead** (skips steps 2–3: ROADMAP.md and tasks/001-first-task.md, as before).
- **2 Capabilities**: a dotted `.pw-notice` “Suggested · From your sentence: … Suggestions are marked, never pre-checked.”, a search field, then `fieldset.pw-capgroup` per group (Accounts, Data, Screens, Together, Games, Publish), each row `label.pw-cap`: checkbox, name, one `small` line, `.pw-cap__meta` “Adds: … · Needs: …”. A capability that can't be chosen is `aria-disabled="true"` with its reason in the meta line; never hidden. A conflict between two chosen ones shows `.pw-cap__warn` under the second.
- **3 Packages**: separate from capabilities; one app, one or more packages (Web app, App with no server, Phone app, Terminal app). Each says what it gets and what it can't carry (“Multiplayer is off in this package”). At least one.
- **4 Summary**: `dl.pw-facts`: Name, Capabilities, Packages, The base (“23 files, 17 tests, all passing on this Mac”), Languages (English and Japanese, always), Your first phase (Discussion). Warnings as `.pw-cap__warn`. **Create** assembles the base, runs its tests and commits; if a test fails, nothing is created and the failing capability is named.

## Add a Capability…

Project menu. The same rows, filtered: ones already in the project are disabled with “Already in this project”. A facts list says what changes (files added and changed, tests added), Safety (“every existing test must still pass; if one fails, nothing is kept”) and Undo (one request). **Cancel** · **Add Capability** (default). Its result is a normal done row.

## Phone

Each step is a full-screen page: Cancel, the step's name and “2 of 4” in the bar; Back · Next (Create on the last) at the bottom; rows are 44 px+ with 22 px checks.

## Copy

Plain words for every capability; no framework names in the rows (they live in the base's README). Packages say how it runs, not what it is built with.
