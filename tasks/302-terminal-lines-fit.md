# 302: Terminal Pi never exits on a wide line; console commands never crash

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items.

- [ ] Every harness line passes through pi-tui's width cut (visibleWidth/truncateToWidth); no 60-column floor; kv, hint and
  heading lines are cut too (item 1: Pi 1.1.0 exits with "Rendered line N exceeds terminal width": /harness list at 80,
  /update at 120, every command at 40, a G-015 tool row at 253 columns).
- [ ] The phase-refusal tool row renders as lines, not a comma-joined array (item 10, tool-render.mjs:24).
- [ ] The footer and /status survive a failing Gate /phase (item 9); /reports, /report, /bench survive malformed
  records; /update is not killed at 30 s while its fetch waits 30 s (item 25).
- [ ] Test: every admin view, toolLines and renderNotice case, English and Japanese, at widths 20/40/80/120, emoji and
  combining marks included: visibleWidth(line) <= width.
