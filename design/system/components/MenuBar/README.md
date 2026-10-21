# MenuBar

The one menu bar at the top of the page: the π menu, File, Edit, View, Project, Agent, Window, and on the right the model and the agent's state.

- Markup: `<nav class="pw-menubar" role="menubar">` with `<button class="pw-menubar__title" role="menuitem" aria-haspopup="menu" aria-expanded>` per title. The open title has `aria-expanded="true"` and inverts.
- Keyboard: Left/Right move between titles, Down or Return opens, Esc closes. While one menu is open, hovering another title opens it.
- Right side (`.pw-menubar__status`): `Gemma 4 · High thinking`, then the agent state as a StatusButton (glyph + words) that opens Activity · All Projects: Ready, Working · 1 waiting, Stopped · 1 needs attention, Connection interrupted.
- At 760px and below it is replaced by the PhoneBar.
- The menu bar never changes its titles. Unavailable commands are disabled, not hidden.
- Window menu: Projects, Files, Review, Event Info, Preview ⌥⌘P (checkboxes), a separator, then the app-level windows **Activity · All Projects ⌘3** and **Gate · All Projects ⌘4** (radio: checked when that window is open). View holds only Chat ⌘1 and Work ⌘2 (disabled while Activity or Gate is open), the editor mode and Review commands.
- Agent menu: **Show Task Record** / **Hide Task Record** (⌥⌘R, Activity only) follows the label of Activity’s button; then **Run on Its Own** ⌥⌘A (checkbox; a quick toggle of the one Settings › Pi setting for all projects, showing the risk notice every time it is turned on; round 10). Compact Now, New Conversation… and Earlier Conversations are not built and came off (round 9).
- π menu: About Pi Workbench, **Check for Updates…** (round 9), Settings…, Desktop Pattern…, Open on Phone…. When a newer version is known (checked once a day), a 6px dot sits on the π title and the item reads “● New version”.
## Model and thinking level (task 147)

- In the status area, before the StatusButton: `<span class="pw-menubar__picks"><button id="model-button" class="pw-menubar__pick" aria-haspopup="menu" aria-expanded aria-controls="model-menu">gemma4:12b</button> · <button id="effort-button" class="pw-menubar__pick" … aria-controls="effort-menu">High thinking</button></span>`. They are menu titles: wash on hover, inverted while open, keyboard like the other titles (Left/Right reach them after Window).
- **Model menu** (`.pw-menu.pw-menu--end`): one `menuitemradio` per installed Ollama model, the Ollama tag as the label and what it can do as the key text: “thinks · sees”, “thinks”, “no thinking”, “no tools”. A model without tools is `aria-disabled` (Pi cannot work without them). After a separator, a `.pw-menu__note` (role="note", not a menu item): “One model in memory at a time. Switching unloads the current one.”
- **Thinking menu**: Off, Low, Medium, High (radio): the four levels Ollama knows; note “Applies from the next request.” `/models use <name> <effort>` completes the same four. Settings saved as minimal/xhigh/max still load, read as Low or High.
- **Loading**: the model title reads “Loading qwen3:8b…” until Ollama reports it ready, then a Toast without Undo: “qwen3:8b is ready. Ollama keeps only this model in memory.”
- **No thinking**: the thinking title reads “No thinking”, `aria-disabled`, dimmed; its menu still opens, items dimmed, note “<model> does not think. Choose a model that thinks to set a level.” Disabled, never hidden.
- Use the Ollama tag everywhere (title, menu, toast); not a marketing name in one place and a tag in another.
- Phone: the π sheet has a **Model** group under Agent with two 44px rows, Model › and Thinking ›, each opening a sheet with the same list. Boards: MB_Model, Ph_Model, Ph_ModelList.

## Round 17 · Proposed: Overview (plan 354)

- Window menu: after Open App in New Window ⌃⌥B / Copy App Address and a separator, the app-level radios **Overview · All Projects ⌃⌥0**, **Activity · All Projects ⌃⌥3**, **Gate · All Projects ⌃⌥4**.
- The StatusButton opens Overview (not Activity): words "5 need you · Working on Class Notes". See StatusButton § Round 17.
- While Overview is open, View's Chat ⌃⌥1 and Work ⌃⌥2 stay enabled and return to the last project, as from Activity and Gate.

## Round 18 · Proposed (decisions 5, 20)

- Window › **Projects** (checkbox) at 1024: unchecked by default. Checking it opens the Projects window; once opened explicitly it stays open when the browser is resized to 1024, with its scroll, open groups and selection. Only its close box or unchecking hides it. Board R18_Overview1024, R18_OverviewWindows.
- JA: Window › 「概要 · すべてのプロジェクト ⌃⌥0」; the StatusButton words follow StatusButton § Round 18.

## Round 18 addendum (proposed, awaiting approval)

- **Q6 (Recommended).**
  - ⌃⌥N stays **New File…** everywhere (round 13), including while focus is in the Ask pane.
  - In Overview, File › New File… is disabled with the note "Open a project to add a file." (`aria-describedby`), and New Task… with "Open a project to add a task." (A's extension).
  - New Conversation has no shortcut. It is reached with ⌃⌥0, then Tab to the pane's **New** button or to the conversation popup's first item.
  - The Window menu is unchanged.
  - **Would supersede:** round 18's "⌃⌥N anywhere in the Ask pane = New Conversation" and the `aria-keyshortcuts="Control+Alt+N"` on New and on the popup item.
  - **Alternative (not recommended):** File lists "New Conversation ⌃⌥N (in Ask)".
  - Board: R18A_NewConversationKeys.
