# Menu

A pull-down menu under a menu-bar title, and the same list inside the phone's π sheet.

- `<div class="pw-menu" role="menu">` of `<button class="pw-menu__item" role="menuitem">`; a checked item uses `role="menuitemradio" aria-checked="true"` (View › Chat ⌘1 …); a disabled item `aria-disabled="true"`.
- Shortcut on the right in `.pw-menu__key`. Separators are dotted (`.pw-menu__sep`).
- Labels are Title Case verbs; an ellipsis means a dialog follows.
- The full command map is in IMPLEMENTATION.md § Menus.
- Submenu: an item with `aria-haspopup="menu"`, `aria-controls` and a `▸` key opens a nested `.pw-menu--sub` (Block › Turn Into, Block › Add Block Below, Agent › Earlier Conversations). Click, hover or Right opens it; Left or Esc returns to the item. On phone it opens inline under the item. `installPopup` in `js/menubar.mjs` handles one level.
- Command changes in this system: View holds Chat ⌘1 and Work ⌘2 only (always enabled: from Activity or Gate they return to the last project in that view). Window ends with Activity · All Projects ⌘3 and Gate · All Projects ⌘4. Agent adds Compact Now, New Conversation…, Earlier Conversations ▸ (date range, message count; newest first). File has New File… ⇧⌘N and New Task… ⌘T.
- Block menu (handle): Turn Into ▸, Add Block Below ▸ (both list Paragraph, Heading, Task, Bullet, Number, Quote, Table, Code, Raw Markdown), then for a Table only: Add Row, Add Column, Edit as Markdown ↩; then Move Up/Down, Comment on *Type*, Ask Pi About *Type*…, Delete *Type*.
- Round 4: **View** no longer holds Chat and Work; **Window** starts with Chat ⌘1 and Work ⌘2, then Projects, Files, Review, Event Info, then Activity · All Projects ⌘3 and Gate · All Projects ⌘4. View is how you see the current thing; Window is where you are.
- **File** adds Rename or Move… before Move to Trash…; both act on the selected folder, or else the open file.
- Notes inside a menu use `.pw-menu__note` (role="note"), never a disabled item.
- **Project** menu (task 154): Open Project Chat, Ask Pi About This Document…, Copy Folder Path, ═, **Rename Project…**, **Move Project…** (reads **Locate Folder…** when the folder is missing), ═, **Remove from List…**, **Move Project to Trash…**, ═, the project list. All act on the open project, the one named in the main window's title bar and selected in the Projects window. Dimmed, never hidden: with no project, everything; with a missing folder, Rename, Copy Folder Path and Move to Trash.
- Model menu, round 5: the key text adds what the model can run at once — “parallel” (the chat and the worker together), “one at a time” (the worker pauses while Pi answers you) or “checking…” (measured once per model and Ollama version). A chosen model that is no longer installed stays in the list, dimmed, “not installed”; the fallback toast names both: “deepseek-r1:14b is not installed. Using gemma4:12b.”
- Round 15 (task 321): **Window** adds, after Preview ⌃⌥V and a separator, **Open App in New Window ⌃⌥B** and **Copy App Address**; both disabled with the Preview foot's reason when the app is not running (Board R15_PreviewNarrow).
- Round 17 (proposed, plan 354): **Window** gains **Overview · All Projects ⌃⌥0** as the first app-level item (radio), before Activity · All Projects ⌃⌥3 and Gate · All Projects ⌃⌥4. The phone View popup adds **Overview · all** first after the separator (key text "5 need you", or "Nothing needs you"). Boards R17_OverviewEntry, Ph17_Entry.

## Round 18 addendum (settled or superseded in round 19 — see Round 19)

Revised 21 Oct after review.

- **Q6.** The File menu in Overview has three states (preview block):
  - Nothing selected: New File… ⌃⌥N disabled with `.pw-menu__note` "Open a project to add a file."; New Task… ⌃⌥T disabled with "Select a project to add a task.".
  - Superseded: Class Notes row selected: "New Task in Class Notes…" ⌃⌥T enabled; New File… still disabled. (round 19 A6: “selected” means explicitly selected: Space, or a click on the row’s empty area)
  - In a project: both enabled.

  The conversation popup's first item is "New Conversation", with no key text and no `aria-keyshortcuts`. Alternative (not recommended): "New Conversation ⌃⌥N (in Ask)". Board: R18A_NewConversationKeys.

## Round 19 (decided, owner-delegated 21 Oct 2026)

Decided (round 19, A6). The File menu in Overview (preview block) has three states:
- No selection: New File… and New Task… are both disabled, with their notes.
- Class Notes selected: "New Task in Class Notes…".
- Pong selected in another window: "New Task in Pong…".

Disabled items keep `.pw-menu__note` reasons linked by `aria-describedby`. Board: R19_OverviewSelection.

### Follow-up decisions (21 Oct)

Decision 5. The stale File menu item reads "New Task in Class Notes…", disabled, with the `.pw-menu__note` "Reconnect to add a task. The selection is checked again first." (board R19_OverviewSelection).

Decision 4. The Project menu keeps Remove from List… (round 8), which now opens the revised confirmation (board R19_ProjectRemove).
