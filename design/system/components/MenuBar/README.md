# MenuBar

The one menu bar at the top of the page: the π menu, File, Edit, View, Project, Agent, Window, and on the right the model and the agent's state.

- Markup: `<nav class="pw-menubar" role="menubar">` with `<button class="pw-menubar__title" role="menuitem" aria-haspopup="menu" aria-expanded>` per title. The open title has `aria-expanded="true"` and inverts.
- Keyboard: Left/Right move between titles, Down or Return opens, Esc closes. While one menu is open, hovering another title opens it.
- Right side (`.pw-menubar__status`, `role="status"`): `Gemma 4 · High thinking` and the agent state with its glyph: Ready, Working · 1 waiting, Connection interrupted.
- At 760px and below it is replaced by the PhoneBar.
- The menu bar never changes its titles. Unavailable commands are disabled, not hidden.
