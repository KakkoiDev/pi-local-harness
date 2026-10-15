# 188: A browser tool for Pi: reproduce and measure, don't guess

Kind: code

Request 2026-10-15: "build the browser tool for Pi" (docs/lessons/L-008: Pi could not observe task 173's bug and
guessed its cause).

- [x] Red (node, `tests/harness/browser.test.mjs`): the input is checked (size, local pages only, steps); on a page that
  reproduces task 173's pattern at 1024×560 it reports the scrolled and scrollable desk, the hidden element placed
  against the desk, boxes, styles, the console error and a screenshot, and stops at a step that fails; the person's own
  workbench port is refused; by default a scratch workbench with a Demo project answers a typed message; Pi gets it as a
  tool, with one scratch workbench per session.
- [x] `harness/browser.mjs`: Chromium found (PI_BROWSER, Chrome, Chromium, Playwright's download), driven through the
  DevTools protocol with Node's WebSocket; the scratch workbench (this checkout's services, temporary data, the fake Pi);
  steps and probes. The extension registers the tool (Gate checks it as a reversible write), stops the scratch
  workbench at the end of the session, draws its row; AGENT.md, the console guide and lesson L-008 name it.
