# PhoneBar

The menu bar at 760px and below: π (opens the π sheet), the current view as a popup button (Chat ▾), and on the right the agent status as a StatusButton.

- 48px tall, 44px buttons. Leaves the top safe-area inset clear.
- **Where commands live on the phone (round 8)** — every desktop command is reachable within three taps of the screen it acts on, or is named as done another way. Board: Ph8_Map.
  - **π sheet**: app-wide only: projects (each row with ⋯ for Rename, Move, Locate, Remove, Trash, Copy Folder Path), Agent (Activity, Gate), Model (Model ›, Thinking ›: Off, Low, Medium, High), New Project… / Add Existing Folder…, Settings…, About.
  - **View menu** (Chat ▾): Chat · Work · Preview (radio, Preview shows the app's state), then the current view's commands: Chat — Compact Now, New Conversation…, Earlier Conversations ›; Preview — App language, Reload, Open App.
  - **⋯** on the thing itself: the open file (path as title; Rename or Move…, Copy Path, Ask Pi About This File…, View as Markdown, Reload from Disk, Download Draft…, Move to Trash…), a folder (opened as a level), a project row.
- **In a document**: the document bar (‹ Files, name, Comments, ⋯) sits under the phone bar while reading; the phone bar hides on scroll down and returns on scroll up; while editing (keyboard up) only the document bar shows. **Comments** is always there, with the open count when there is one.
- Landing: Show in Activity, Show in Gate and a status with one thing needing attention open the detail; Back goes to the list.
- No keyboard hints (⌘) on the phone. Toasts sit above the edit bar and the keyboard. Every control at least 44 × 44 with its label inside the hit area; checkboxes and radios 22px in 44px rows.
- Mac-only settings (Desktop pattern, Return sends) are not shown; Settings says they are Mac settings.
- Round 9: the π sheet adds **Check for Updates…** (“● New version”, and a dot on π) and **Add to Home Screen…** (only away from the Mac). Chat's view menu shows the views only.
- Round 17 (proposed, plan 354): the View popup lists **Overview · all** first after the separator, then Activity · all and Gate · all; the π sheet's **Agent** group starts with **Overview › 5 need you · 1 working** ("Nothing needs you" when none). The StatusButton opens the Overview screen. An item opened from Overview shows "‹ Overview" in place of π and the view popup. Boards Ph17_Overview, Ph17_OverviewItem, Ph17_Entry, Ph17_EntryPi.
- Round 18 (proposed, decision 4): with a work-blocking service down the StatusButton reads "Can’t run work · Ollama stopped · 2 need you" in two lines inside the 44 px button (`.pw-statusbtn--wrap`); the view popup button keeps its label. Overview rows add **Ask About {project}**, **Open in Activity** and ⋯ as 44 px buttons; a row's ⋯ is a sheet (Open Chat · Ask About {project} · Open in Activity) with no Open in New Window (one window on the phone). Boards Ph18_Overview, Ph18_OverviewService, Ph18_OverviewRowMenu, Ph18_OverviewHistory.

## Round 18 addendum (proposed, awaiting approval)

- **Q1.** "Can’t run work · 2 services stopped · 2 need you" wraps to two lines in the 44 px StatusButton (Ph18A_ServicesStopped).
- **Q6.** Nothing changes on the phone, which has no keyboard shortcuts.
- **Q10.** On the phone, Cancel Request… sits in Activity's request detail; its alert is a sheet with **Keep Request** first and default, then **Cancel Request** (Ph18A_CancelRequest).
