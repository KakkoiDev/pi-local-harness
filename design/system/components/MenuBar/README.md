# MenuBar

The one menu bar at the top of the page: the π menu, File, Edit, View, Project, Agent, Window, and on the right the model and the agent's state.

- Markup: `<nav class="pw-menubar" role="menubar">` with `<button class="pw-menubar__title" role="menuitem" aria-haspopup="menu" aria-expanded>` per title. The open title has `aria-expanded="true"` and inverts.
- Keyboard: Left/Right move between titles, Down or Return opens, Esc closes. While one menu is open, hovering another title opens it.
- Right side (`.pw-menubar__status`): `Gemma 4 · High thinking`, then the agent state as a StatusButton (glyph + words) that opens Activity · All Projects: Ready, Working · 1 waiting, Stopped · 1 needs attention, Connection interrupted.
- At 760px and below it is replaced by the PhoneBar.
- The menu bar never changes its titles. Unavailable commands are disabled, not hidden.
- Window menu: Projects, Files, Review, Event Info, Preview ⌥⌘P (checkboxes), a separator, then the app-level windows **Activity · All Projects ⌘3** and **Gate · All Projects ⌘4** (radio: checked when that window is open). View holds only Chat ⌘1 and Work ⌘2 (disabled while Activity or Gate is open), the editor mode and Review commands.
- Agent menu: **Show Task Record** / **Hide Task Record** (⌥⌘R, Activity only) follows the label of Activity’s button; then **Run on Its Own** ⌥⌘A (checkbox, per project; round 10). Compact Now, New Conversation… and Earlier Conversations are not built and came off (round 9).
- π menu: About Pi Workbench, **Check for Updates…** (round 9), Settings…, Desktop Pattern…, Open on Phone…. When a newer version is known (checked once a day), a 6px dot sits on the π title and the item reads “● New version”.
## Model and thinking level (task 147)

- In the status area, before the StatusButton: `<span class="pw-menubar__picks"><button id="model-button" class="pw-menubar__pick" aria-haspopup="menu" aria-expanded aria-controls="model-menu">gemma4:12b</button> · <button id="effort-button" class="pw-menubar__pick" … aria-controls="effort-menu">High thinking</button></span>`. They are menu titles: wash on hover, inverted while open, keyboard like the other titles (Left/Right reach them after Window).
- **Model menu** (`.pw-menu.pw-menu--end`): one `menuitemradio` per installed Ollama model, the Ollama tag as the label and what it can do as the key text: “thinks · sees”, “thinks”, “no thinking”, “no tools”. A model without tools is `aria-disabled` (Pi cannot work without them). After a separator, a `.pw-menu__note` (role="note", not a menu item): “One model in memory at a time. Switching unloads the current one.”
- **Thinking menu**: Off, Low, Medium, High (radio): the four levels Ollama knows; note “Applies from the next request.” `/models use <name> <effort>` completes the same four. Settings saved as minimal/xhigh/max still load, read as Low or High.
- **Loading**: the model title reads “Loading qwen3:8b…” until Ollama reports it ready, then a Toast without Undo: “qwen3:8b is ready. Ollama keeps only this model in memory.”
- **No thinking**: the thinking title reads “No thinking”, `aria-disabled`, dimmed; its menu still opens, items dimmed, note “<model> does not think. Choose a model that thinks to set a level.” Disabled, never hidden.
- Use the Ollama tag everywhere (title, menu, toast); not a marketing name in one place and a tag in another.
- Phone: the π sheet has a **Model** group under Agent with two 44px rows, Model › and Thinking ›, each opening a sheet with the same list. Boards: MB_Model, Ph_Model, Ph_ModelList.
