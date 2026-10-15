# L-008: Could not observe the bug, so it guessed the cause

**Seen** 2026-10-14/15, task 173 ("Coming back to Chat from Activity leaves the view lifted, white at the bottom"). Pi read
the code and guessed the chat thread's scroll position. The real cause was elsewhere: between 761 and 1100px wide the
desk behind the windows is `position: relative`, so a hidden screen-reader line (`#chat-announce`, `position: absolute`,
inside the thread) was placed against the desk, below the whole conversation, and made the desk scrollable. Any scroll
into view then lifted every window. (The person asked: "What tools, knowledge, etc. would it have required to find the
right origin of the issue?")

**How the cause was found** (by Claude, in the browser pane): open the workbench with a long conversation at 1024px, send
a message, see the window lift; list every element with `scrollTop > 0` (only `#desk`); compare the desk's
`scrollHeight` with and without the thread (2392 against 740); list the absolutely positioned elements inside the
thread and their `offsetParent` (`#chat-announce`, positioned against `#desk`). Four measurements, no reasoning about
CSS needed.

**What Pi lacked**

1. *A browser it could drive.* No Playwright in its shell, no browser tool: it could only read code. Reading code, the
   thread is the obvious scroller; the desk is not.
2. *The conditions.* The bug only happens between 761 and 1100px. The report did not give the width (a person would not
   think to), and Pi had no way to get it.
3. *A rule to reproduce first.* Nothing made it observe the bug before fixing it; it wrote a fix and a test for a cause
   it had never seen.
4. *Facts instead of reasoning.* "An absolute element is placed against its nearest positioned ancestor, and makes it
   scrollable" is easy to look up and hard for a small model to reason out across stylesheets and media queries.

**Done**
- Made easy (task 188): Pi's `browser` tool opens a page in headless Chromium (driven through the DevTools protocol, no
  npm packages) at the size it asks, runs steps (click, type, press, wait, go to a path, POST to the scratch
  workbench) and returns facts as data: scrolled and scrollable elements, positioned elements and what they are placed
  against, boxes, computed styles, text, console errors, a screenshot (also shown to a model that sees images). By
  default it is a scratch workbench from the checkout with a Demo project and the fake Pi; the person's own workbench is
  refused. Its test reproduces this bug's pattern and finds the desk. Tests: `tests/harness/browser.test.mjs`.
- The browser suites can be run from any shell (task 180), once Playwright is installed.
- Told, only when it applies (task 196): a request about the page ("the view is lifted", "white at the bottom", layout,
  scroll, width…) brings `harness/guides/page-layout.md` into the prompt: observe with the browser tool at the size
  needed, probe what scrolls and what it is placed against, then read the CSS of exactly those elements.

**Open**
- Checked: bug reports carry their conditions: a "Report a Problem…" command in the web workbench records the window
  size, view, scroll positions, console errors and a screenshot into the task.
- Enforced: a bug task's Red box needs a failing test that reproduces the report (G-010 sees a failing run; the task
  says what it reproduces).
