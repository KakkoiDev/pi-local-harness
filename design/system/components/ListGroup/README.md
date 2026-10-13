# ListGroup

A titled, collapsible section of a list. The Files window has two: **Plan** (ROADMAP.md and `tasks/*.md`) above **Files** (everything else in the folder). Grouping is display only; nothing moves on disk.

## Markup

```html
<nav class="pw-window__body" aria-label="Files">
  <section class="pw-group" aria-labelledby="files-plan-title">
    <div class="pw-group__head">
      <h3 class="pw-group__title" id="files-plan-title">
        <button class="pw-group__toggle" aria-expanded="true" aria-controls="files-plan">
          <span data-icon="disclosure-open"></span>Plan<span class="pw-group__count">11 open</span>
        </button>
      </h3>
      <button class="pw-group__action" data-command="new-task" aria-label="New Task…"><span data-icon="plus"></span></button>
    </div>
    <div class="pw-group__body" id="files-plan" role="list"> …ListRows… </div>
  </section>
  <section class="pw-group" aria-labelledby="files-other-title"> …same, “Files”, action New Page… </section>
</nav>
```

- Disclosure pattern: a `<button aria-expanded aria-controls>` inside a heading. Collapsed sets `hidden` on `.pw-group__body` and swaps the icon to `disclosure-closed`.
- Header: drawn like the table and info-bar headers elsewhere — chrome-meta (13px/18px) at regular weight, row height `size-row` (44px at phone width), 1px ink rule under it, and a 3px double rule between the two groups (the same rule that closes every info bar). Headers are sticky at the top of the scrolling list.
- Count on the right (`.pw-group__count`): Plan “N open”, Files the number of entries at the top level; during search, the number of matches.
- Action (`.pw-group__action`): one `plus` button per group, with an `aria-label` naming the command (New Task… on Plan, New Page… on Files). It is outside the toggle (never nest buttons). The same commands stay in the File menu (⌘T, ⇧⌘N).

## Behaviour

- Both groups start expanded. Collapse state is remembered per project (`writeState('fileGroups', {[project]: {plan, files}})`).
- Keyboard: the toggles and rows form one roving-focus list (one tab stop). ↑/↓ move through visible toggles and rows in order and cross from Plan into Files. → on a collapsed toggle or folder expands it; on an expanded one moves to its first child. ← on a row moves to its folder or group toggle; on an expanded toggle or folder collapses it. Home/End go to the first/last visible item. Return or Space on a toggle flips it; on a file opens it. Tab leaves the list; the `+` actions are separate tab stops.
- Search (⌘F): both groups filter as you type and are shown expanded without changing the stored state. Matches show flat (Plan: task name; Files: relative path, e.g. `harness/agent-lock.mjs`). A group with no matches is hidden; when neither has one, the list shows the single line “No matching files”. A note under the list says “N matches for “q” in both groups. Esc clears.”.
- Empty Plan (a folder added with Add Existing Folder… that has no ROADMAP.md and no tasks/): the Plan group still shows, with “No roadmap or tasks in this folder.”, a **Create Roadmap** button, and the help line “Adds ROADMAP.md and tasks/001-first-task.md. Nothing else changes.”.
- Empty Files: “No other files yet.” in `.pw-group__empty`.

## Phone (≤760px)

The two groups become a segmented control at the top of the Files screen: **Plan · 11 open** | **Files · 19**, with the `+` action beside it for the selected segment (New Task… or New Page…). Search filters both; the segment labels show match counts so matches in the other segment are visible.
