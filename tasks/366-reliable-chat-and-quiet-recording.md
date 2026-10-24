# 366: Recover empty replies and keep recording controls in Settings

Kind: code

Request 2026-10-24: Pong chat no longer replies; empty unattended reports are noise; recording should default on with controls and trade-offs in Settings.

- [x] Red: empty/reasoning-only replies after reading recover once; no empty report cards; recording defaults and stop fencing.
- [x] Recover missing answers and compact output-limit failures within the existing wake-up budget without changing phase or approval.
- [x] Keep reports with real tasks, decisions, external actions or problems; suppress empty legacy and new reports.
- [x] Move recording controls into Settings, keep structural capture default on, preserve explicit opt-outs and explain disabling.
- [x] Green: unit/integration and complete browser suites, then commit, push and installed build checks.

## Scenarios

### US-366 an empty model reply fails clearly and I can retry and receive an answer
Given a model request that ends without an answer
When I retry from the failed message
Then the next answer arrives and the composer remains usable

### US-367 ordinary chat does not show an empty unattended report
Given Run on its own is enabled
When Pi answers without doing work or making an automatic decision
Then no empty report card interrupts the conversation

### US-368 recording runs quietly and Settings explains and controls both surfaces
Given a fresh WorkStation with Preview
When I use it and turn recording off in Settings
Then structural actions are captured by default without permanent recording controls and turning off stops both surfaces without losing history

## Verification

Red: the empty-answer extension tests failed with zero recoveries; the content-free report test returned a report; WorkStation transport default was off; US-368 found a permanent recording control. Green: the complete Python/Node workflow and all six browser suites passed. J16 runs real Pi with a fake model and reproduces read → reasoning-only output-limit stop → compaction → recovery → visible answer in the same request, with Discussion unchanged. US-366 covers exhausted failure/Retry, US-367 quiet reports, and US-368 Settings-only default capture and global off. Existing privacy, late-batch, cross-window stop, storage-error and focus/canvas stories pass. Settings screenshots were reviewed at 1440/1024/390/320. Optional Ruff was unavailable; native screen-reader and live-model/device checks remain manual. No new downloads or edits to Pong/private data. The session closeout records push, installed commit identity and installed story smoke.
