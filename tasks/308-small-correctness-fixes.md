# 308: Small correctness fixes

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Item 17 and documentation-drift items 7, 12-15.

- [ ] task_box: `replace(old, () => new)` so `$&`/`$'` in labels cannot corrupt the file; CRLF task files work.
- [ ] ⌘. stops the request or sends Control-C to a focused terminal preview, never both.
- [ ] Gate's Refresh ⌘R is bound or its label removed; shortcuts the browser keeps (⌘N, ⌘T, ⌘W, ⌘1-9) are listed for the
  designer (round 12) rather than promised.
- [ ] `PI_WEB_EFFORT` from the shell wins over config.json as settings.py says; PI_BROWSER, PI_TEST_CHROME, PI_BENCH_DIR
  listed in settings.INTERNAL; a test greps the code for PI_ variables and requires each to be listed.
- [ ] docs/reference.md's config section matches plh.py (all keys; the `model` key rule).
- [ ] `plh setup browser` checks a pinned hash, not the download's own header (review P3); the harness's Red proof runs
  from Pi's working folder and is audited like any test run (review P3).
