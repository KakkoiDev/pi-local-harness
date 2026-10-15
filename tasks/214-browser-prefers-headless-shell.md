# 214: Pi's browser prefers Chromium's headless shell

Kind: code

The person, 2026-10-15: "is chrome the best lightweight? how about using other browsers like lightpanda?"

- [x] Lightpanda checked: it has no layout or rendering engine (its own docs send layout checks, screenshots and
  responsive tests to headless Chrome), so it cannot give the facts the browser tool exists for (boxes, what scrolls,
  what is positioned against what, screenshots). Not used.
- [x] `findChrome` prefers Chromium's headless shell (no window, no desktop browser; made for automation) from the
  harness's toolchain folder or Playwright's cache, before Google Chrome and the full Chromium; PI_BROWSER still wins.
  Test (node, `tests/harness/browser.test.mjs`) with a scratch cache folder.
- [ ] Measure it against Chrome on this Mac (start time, memory), once the headless shell is downloaded (about 90 MB,
  after the person's yes), and let `plh setup` fetch it into the toolchain folder.
