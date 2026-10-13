# MenuBar

The one menu bar at the top of the page: the π menu, File, Edit, View, Project, Agent, Window, and on the right the model and the agent's state.

- Markup: `<nav class="pw-menubar" role="menubar">` with `<button class="pw-menubar__title" role="menuitem" aria-haspopup="menu" aria-expanded>` per title. The open title has `aria-expanded="true"` and inverts.
- Keyboard: Left/Right move between titles, Down or Return opens, Esc closes. While one menu is open, hovering another title opens it.
- Right side (`.pw-menubar__status`): `Gemma 4 · High thinking`, then the agent state as a StatusButton (glyph + words) that opens Activity · All Projects: Ready, Working · 1 waiting, Stopped · 1 needs attention, Connection interrupted.
- At 760px and below it is replaced by the PhoneBar.
- The menu bar never changes its titles. Unavailable commands are disabled, not hidden.
- Window menu: Projects, Files, Review, Event Info (checkboxes), a separator, then the app-level windows **Activity · All Projects ⌘3** and **Gate · All Projects ⌘4** (radio: checked when that window is open). View holds only Chat ⌘1 and Work ⌘2 (disabled while Activity or Gate is open), the editor mode and Review commands.
- Agent menu adds, after Show Task Record: **Compact Now**, **New Conversation…** and **Earlier Conversations ▸** (Chat only).
