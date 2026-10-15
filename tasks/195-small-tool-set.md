# 195: Each request gets only the harness tools it needs

Kind: code

Strategy 4 of the ones picked on 2026-10-15: local-model practice is a small tool set (each tool costs a small model
attention and invites a wrong call), and the harness had been adding tools (harness, task_box, browser).

- [x] Red (node, `tests/harness/tool-choice.test.mjs`): the console tool in terminal Pi only, task_box in a project that
  keeps tasks, browser when the request talks about something on a page (view, screen, click, scroll, layout, CSS,
  width…) or names a page file; Pi's own tools and other extensions' tools are kept; a tool that is not registered is
  never added.
- [x] Red (node, extension test): a web request about code gets no console and no browser; one about the page lifting
  gets the browser.
- [x] `harness/tool-choice.mjs`; the extension sets the active tools at each question (Pi 1.1's `setActiveTools`), not
  in bare mode.
