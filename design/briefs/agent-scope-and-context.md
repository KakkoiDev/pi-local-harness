# Brief: Agent scope, what Pi sees, and catching the canvas up

Date: 2026-10-13. For: the designer AI that made the Pi Workbench 1-bit handoff.
Canvas: https://claude.ai/artifact/Re2trGpSgYLrd2anCHTRyK. Design system: https://claude.ai/artifact/JrBZmw41xj2wXGSFiDxmB1.
The person asked for "a clean and clear design". Keep Pi Workbench 1-bit: 1-bit ink on paper, existing tokens and components first, no new colours.

There are three parts. Part A and Part B are new design. Part C asks you to draw what was built since your last handoff, so the canvas stays the source of truth.

---

## Part A: Activity and Gate are app-level, not project views

### Problem

The view tabs `Chat ⌘1 | Work ⌘2 | Activity ⌘3 | Gate ⌘4` sit in one row inside the project window. In the person's words: "it is grouped with work and chat as if it were only pertaining to the current project." Chat and Work belong to one project. Activity and Gate do not:

- **Activity** is the single queue of the one agent: every request from every project, and from terminal Pi, first in first out.
- **Gate** is every command check (before and after execution) from every project and terminal Pi.

### Decided (by the person)

1. The project window's tabs are **Chat ⌘1 | Work ⌘2** only. Everything in that window belongs to the project in its title bar.
2. Activity and Gate are **app-level windows**, titled **"Activity · All Projects"** and **"Gate · All Projects"**. Their addresses are `/activity` and `/gate` (project pages are `/p/<project>/chat|work/…`, the Projects home is `/projects`).
3. Opening Activity or Gate shows the **Projects home** in the left window (they cover every project). Each row's project name links into that project.
4. Three ways in, all visible:
   - an **Agent** section in the Projects home, under the project list, with live counts (e.g. "Activity · 1 running, 1 waiting", "Gate · 12 checks, 1 blocked");
   - the **menu bar status** becomes a button: "Working · 1 waiting" opens Activity;
   - the **Window** menu (⌘3 Activity, ⌘4 Gate stay as shortcuts).
5. Context links stay: "Show in Gate" on a tool card jumps to that check.
6. Phone: the view popup reads Chat, Work, a separator, "Activity · all", "Gate · all". The π sheet gets the same Agent section under the projects.

### Decide and show

1. The Agent section in the Projects window: header (a `ListGroup` like Plan/Files?), rows, the live counts and their states (idle: "Nothing running"; attention: "1 needs attention").
2. The menu bar status as a control: resting, hover, pressed, and the attention state (a failed or stopped request). It must still read as status first.
3. The Activity and Gate windows at desktop width, without the project tabs: title bar, toolbar (filters: today Show + Project popups), and how the Project column links into a project.
4. Where the person is when they leave Activity: Back returns; is there also a visible "‹ Projects" or close box behaviour?
5. Tablet (761-1100px): today Event Info floats over the main window; confirm.
6. Phone: view popup with the separator, π sheet with the Agent section, Activity and Gate full screens and their detail screens.

---

## Part B: Showing what Pi sees, and how full the chat is

### Background (built, no design needed)

- Each request now carries a **small chosen context** instead of the whole project: the roadmap compressed to headings and open items, open tasks with progress, the current document, files the request mentions (path, file name, link, "task 59"), then a few related files (linked from the document, the active task, files changed in the last hour, file names sharing a word with the request), then file names only. About 4k tokens. It goes into Pi's instructions for that turn and never into the chat history. Pi can still read anything else with its tools.
- **Comments and "Ask Pi about this whole file"** run on their own, outside the project chat. Their answers appear in the comment thread or under the document, never in Chat. Chat holds only what the person typed in Chat.
- **Long chats** are compacted by the harness after the turn that passes 60% of the 32k window: older turns become a summary.

### Ask

Design these five elements:

1. **"Pi sees: …"** line, before sending, under: the Chat composer, the comment composer (Review window and the phone comment sheet), and the "Ask Pi about this whole file" box. It lists what the context will include, e.g. "Pi sees: ROADMAP.md (plan) · this file · tasks/059-stuck-detection.md · 3 related". It has to fit one line at 380px and degrade (overflow to "+2"). Is each name a link? Is there a way to expand the full list?
2. **"Also read: …"** after a reply: the files Pi opened itself with its tools, on the Pi message in Chat and on Pi's answer in a comment thread.
3. **Context meter in Chat**: how full the conversation is, e.g. "Context 14k of 32k". Where (status bar, info bar, composer row)? States: plenty, near the line (60%), just compacted.
4. **"Earlier conversation summarised"** marker in the Chat transcript where compaction happened. Can the summary be opened?
5. **Agent menu commands**: **Compact Now** and **New Conversation** (starts a fresh chat for this project; the old one is kept). Does New Conversation need an alert, and what does it say? Where is the old conversation reachable afterwards (if at all)?

Also confirm how a **sent comment** reads now that its answer never appears in Chat: today the thread shows "Sent to Pi · waiting in queue / Pi is working on it / answered · can no longer be deleted", and the Review item lost its "Open Chat" link.

---

## Part C: Draw what was built since your handoff

These changes shipped (the person decided them in review). Please bring the boards in line, or tell us where the design should differ.

1. **Projects home, then inside a project** (`body[data-level]`). The left window is either the Projects window (Projects home, `/projects`) or the project window. The project window has: title bar with the project name (close box goes back to Projects), info bar "‹ Projects" + "N open tasks · N folders · N files", Find a file, then Plan above Files (your ListGroup, built as drawn in `Work`/`W_NoPlan`/`Ph_Files`). It shows in every view, not only Work. Choosing a project keeps the current view. Boards: `Main`, `C_ChatDesk`, `C_WorkDesk`, `Work`, `W_NoPlan`.
2. **Work toolbar and ruler**: toolbar = view tabs + "Saved"; ruler = block style popup (the plain type is labelled "Paragraph"), bulleted list and task checkbox tools, spacer, Document popup, Hide/Show Review ⌥⌘R. B / I / { } are left out until inline marks exist. No Add Block, Reload or Move to Trash buttons (File menu only). The "Agent is idle / Open Project Chat" strip and the file-name strip are gone; the status bar shows the file path. Boards: `Final`, `C_WorkDesk`, `Work`.
3. **Adding blocks, Notion-style** (your boards never showed how): the handle menu has **Add Block Below** after Turn Into; Return at the end of a block starts a new one (lists continue; Return on an empty list item makes it a paragraph); Backspace in an empty block removes it; a click on the empty page below the last block adds a paragraph. The handle's hover zone covers the 48px gutter. Menu items name the block's type: "Comment on Task", "Delete Heading" ("Paragraph" is only the plain type). Deleting a block shows a toast with Undo. Boards: `P_Popups` (block handle), `PhoneEdit5`.
4. **Block types look different** in the editor: quote = italic in a dotted frame (as `.pw-doc blockquote`), code = ink frame, mono; bullets show "•", numbers count "1.", "2." in a run. Board: a `DocumentBlock` card update.
5. **Inline thread** sits under its paragraph at full column width (as in `Final`), with the state line then Reply, Ask Pi, Resolve … Delete.
6. **Review window**: each unsent comment has **Ask Pi** on its Review item (the person chose this beyond `Final`); the footer is Show resolved + "Send N Unsent Comments to Pi" (as `Final`); "Ask Pi about this whole file" is folded at the bottom and opens on demand. Empty states use `.pw-empty` copy from `Final`.
7. **New File…** replaces New Page… (⇧⌘N): any name, `.md` by default, folders allowed; the dialog help names the real file: "Creates “notes.md” in pi-local-harness and opens it." **New Task…** (⌘T) creates the next numbered `tasks/NNN-name.md` and adds a roadmap line: "Creates “tasks/060-name.md” in pi-local-harness, adds it to ROADMAP.md, and opens it." Board: `Dialogs2`.
8. **Chat** renders Pi's Markdown (headings, lists, bold, inline code, code blocks, quotes, task items with `pw-check`); the open Reasoning panel stays open while Pi streams.
9. **Phone access off**: when Serve is not enabled on the tailnet, startup says "Phone access off: Serve is not enabled on your tailnet; enable it once at <link>". The Open on Phone dialog may want an off state.
10. **Naming**: the checker is called **Gate** in the product. Your canvas still uses its old name for the checker's boards (the main view, its desk component, the all-checks and empty states, the phone list and detail) and in menus, tabs and copy. Please rename them to Gate (`Gate`, `C_GateDesk`, `G_All`, `G_Empty`, `Ph_Gate`, `Ph_GateDetail`), which are the names the repo copy already uses.

---

## Deliverables

- New boards: the Projects home with the Agent section; "Activity · All Projects" and "Gate · All Projects" windows (desktop, tablet, phone, detail screens); the menu bar status states; the phone view popup with the separator.
- Updated boards: everything named in Part C, and the Chat/Work boards without Activity/Gate tabs.
- Part B elements placed on `C_ChatDesk`, `Final` (comment composer and thread), `PhoneEdit3`, and a Chat state with the summary marker.
- Component cards (README + CSS additions with token names only) for anything new: e.g. a context line, a meter, a status button.
- A short `IMPLEMENTATION.md` section per part (markup, ids, ARIA, states), like your earlier handoff.

When you are done, the repo re-syncs the canvas and system into `design/` (see `design/README.md` § Backup) and builds from them.
