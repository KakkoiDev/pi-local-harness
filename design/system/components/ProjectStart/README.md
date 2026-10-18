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

## Round 13: as built, revisited (R13_NPName, R13_NPCaps, R13_NPParts, Ph13_NPName, Ph13_NPPick, Ph13_NPPackages)

- **Create in** is a row, “~/code · Choose… ›”, that opens the folder browser in pick mode (the browser of Add Existing Folder and Ph8_ChooseFolder: breadcrumb, folders, **New Folder…**, **Choose “code”**). Not a popup.
- The help under the sentence: “The workbench reads the sentence to suggest capabilities in the next step (by their words, in English and Japanese). Nothing is chosen for you, and Pi isn’t asked.”
- A suggested row carries a bold **Suggested** at the start of its meta line, besides the notice above the list.
- **Available now**: Database, Works offline, Dashboard and charts, Multiplayer (real time), Game loop and collision, Installs on a phone, and **Share by QR code** (Publish: “A QR code that opens the app on a phone on your network. Adds: a QR code on the About page, 2 tests”). The rest stay listed, disabled, with “Not available yet: <why>” as their meta line.
- **Packages**: one **base package** (App with no server, Web app or Terminal app); the other base packages are disabled with “Not available yet together with <chosen>: one source for several packages needs the browser adapter (plan 253, task 277).” **Phone app** sits under “On a page package”, needing App with no server or Web app. “Uncheck the base package to choose another.”
- **Create failed** (the Summary, dialog stays open): `.pw-cap__warn` “Create stopped: a test of <capability> failed. Nothing was created; <path> doesn’t exist.”, then “Failing test: <test> (<file>), from <capability>”, the test output in `.pw-output` (dotted, mono, scrolls past 180 px), a help line with the way out. Buttons: Back · Cancel · **Try Again**.
- **Add a Capability…**: radios, one capability per request (“so each one is tested and undone on its own”); rows already in the project and not-yet-available rows are disabled with their reason. **What changes** reads “Choose a capability to see what it adds.” and **Add Capability** is disabled until one is chosen; then the facts fill in (files added and changed, tests added). The result is the standard done row: “Added <capability>: … Tried it: all N tests of the base pass, M of them new.”
- **Key**: New Project… is **⌃⌥⇧N** (round 13). Installed as an app, ⌘N still works; menus show ⌃⌥⇧N.
