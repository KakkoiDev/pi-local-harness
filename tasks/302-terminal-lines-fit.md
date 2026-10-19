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

## Scenarios

### US-new terminal: every harness line fits the terminal width, at 20, 40, 80 and 120 columns, in English and Japanese
Given terminal Pi in a terminal 40 columns wide
When I run /harness list, /update, /status and a command Gate refuses
Then every line is cut to the width, with emoji and combining marks counted right, and Pi does not exit

### US-new terminal: /status and the footer still show when Gate cannot say the phase
Given Gate's /phase fails
When I run /status
Then /status answers with the phase unknown and why, and the footer is still drawn

### US-new terminal: /reports and /bench skip a malformed record and show the rest
Given a saved report record that is malformed
When I run /reports, /report and /bench
Then each lists the good records and says one record could not be read
