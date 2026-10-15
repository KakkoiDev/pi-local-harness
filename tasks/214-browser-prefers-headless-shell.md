# 214: Pi's browser prefers Chromium's headless shell

Kind: code

The person, 2026-10-15: "is chrome the best lightweight? how about using other browsers like lightpanda?"

- [x] Lightpanda checked: it has no layout or rendering engine (its own docs send layout checks, screenshots and
  responsive tests to headless Chrome), so it cannot give the facts the browser tool exists for (boxes, what scrolls,
  what is positioned against what, screenshots). Not used.
- [x] `findChrome` prefers Chromium's headless shell (no window, no desktop browser; made for automation) from the
  harness's toolchain folder or Playwright's cache, before Google Chrome and the full Chromium; PI_BROWSER still wins.
  Test (node, `tests/harness/browser.test.mjs`) with a scratch cache folder.
- [x] Measured 2026-10-15 ("let's get that tool"), Pi's browser tool on the same page, 5 looks each: headless shell 155
  525 ms median, ~420 MB peak; the full Chromium Pi used until now 837 ms, 922 MB (Google Chrome is not installed here).
  On disk 211 MB vs 305 MB.
- [x] `plh setup browser` (`harness/setup.py`): Chrome for Testing's headless shell, pinned, checked against the MD5
  in Google's storage headers, unpacked into `<data>/toolchain/chrome-headless-shell` (where `findChrome` looks first);
  a second run says it is already installed; a mismatched download installs nothing. Tests (python,
  `tests/test_setup.py`) with a local fake download. Installed on this Mac.
