# Brief: round 9

Date: 2026-10-15. Round 9. Published for the designer: https://claude.ai/artifact/VdvrKzbQ8jBBYbVbuXFL7S. After round 8 (Phone parity, task 222), which is built: π sheet with Model and Thinking, the
view menu's commands, the document bar, file and folder ⋯, View as Markdown, Comments with none open, the Ask sheet,
Stop / Start in the Preview foot, landing on details, the folder browser as its own step, 44 px targets.

Five things need the designer: four new pieces of interface that were built or planned without a board, and four
places where the round 8 boards and the code differ.

## New: needs a board

### 1. Check for Updates… (task 219)

Today terminal Pi has `/update`: it fetches GitHub, lists what is new in plain words, and updates only when the person
says yes. It never updates over changes that are not saved, or over the copy's own commits. The web workbench has
nothing yet.

- **Where:** π › Check for Updates… on the desk; the π sheet on the phone (an app-wide command).
- **A mark** when a newer version is known (one check a day). Where does it sit: the π menu title, the item, the
  status area?
- **The sheet:** "A new version of Pi Workbench is ready" with the list of changes (up to 20 lines, plain words, e.g.
  "The phone asks Pi in its own sheet") and **Update** / **Later**. After Update: "Updated. Restart plh to use it.",
  then the restart steps.
- **The states:** up to date; can't reach GitHub; blocked, with the reason ("This copy has its own changes (2 commits
  not on GitHub), so it is not updated automatically.", "Some files of Pi Workbench were edited and not saved in a
  commit; updating would overwrite them.").
- **Installed copies follow releases** (plan 221), so the list will come from release notes.

### 2. Add Pi Workbench to another device (plan 221)

The main computer runs everything. Other devices (a phone, a second laptop) open it over Tailscale and can add it as an
app (a PWA). The offer must say plainly that nothing runs on that device.

- **The install sheet**, shown once, and later from π › Add to Home Screen…. It appears **only away from the main
  computer**: the main computer never sees it. Proposed copy: "Add Pi Workbench to this phone. It opens the workbench
  running on <Mac name>: Pi and the model keep running there, nothing runs on this phone. The Mac must be on and
  Tailscale connected." Then the steps: iPhone (Share › Add to Home Screen) or Android (Install app).
- **The app icon**, at the sizes a home screen and a manifest need (1-bit, the π mark?).
- **The main computer's icon** (Dock, Start menu, applications menu). It starts the whole workbench without a
  terminal, plus a menu-bar or tray item to quit it. What does that item show: running, the web address, Quit?
- **Offline** on an installed device: Ph_Offline's "Can't reach the Mac…" copy (designed, not built yet).

### 3. A fourth project kind: Terminal app (task 217)

New Project… has four kinds in the code: Web app, App with no server, **Terminal app** ("Runs in a terminal, keys and
text only; the Preview shows it in the browser."), Empty folder. P_NewProject and Ph8_NewProject draw three. Where
does it go, and is its help line right? The Preview shows a terminal app in the browser through textual-serve: does
the Preview window need anything different for it (no Phone / Tablet sizes?)?

### 4. Settings › Language (task 215)

Built: Settings has a Language group (English · 日本語 · Match System, each language by its own name). Neither Settings
board draws it, and Ph8_Settings has no Language row. The Preview's app language starts in the workbench's language.
Terminal Pi follows the same setting.

## Boards and code that differ (round 8)

5. **The model is gone (Ph8_ModelGone).** The board says "Pi cannot answer until you choose a model. Your message is
   kept." The server actually falls back to an installed model, so the built line says "<model> is not installed any
   more. Pi uses <other> until you choose another model." with Choose Model…. Keep the fallback (and this sentence), or
   should Pi stop and wait?
6. **Chat's view-menu commands (Ph8_ChatMenu):** Compact Now, New Conversation…, Earlier Conversations ›. None of these
   exists on the desk either: compaction is automatic, and each project has one persistent chat. Should these be
   features (they need their own boards on the desk), or should they come off the board?
7. **Ph8_Settings rows with nothing behind them:** Show lessons, Wait 10 s before the worker starts, Phone access On ›.
   The web Settings has none of them. Some are terminal settings (`/settings`). Which belong in the web Settings, and
   on the desk too?
8. **The Preview when there is no room.** With Work, Review and the Preview all open at 1440 px, Review ran past the
   right edge. Built: the Preview steps aside as a tab (Preview ⌥⌘P in the view tabs) without taking over Work, and
   comes back beside the chat. Is that the behaviour you want, or should Review give way instead?

Also built, for a check: Copy Path copies the full path on the Mac. A detail screen's back button sits in the phone
bar, a document's in the document bar. Opening Activity or Gate from the π sheet shows the list; Show in Activity /
Gate and the status button open the detail.
