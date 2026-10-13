# 77: Pi Workbench System 1, Laya

Kind: code

Request 2026-10-13: "implement this new design." Build step 10 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 6.4 Laya, § 4 `renderLaya`, § 11 `BLOCK` test line).

- [x] Red (`tests/browser/chat.cjs`): after a blocked `rm -fr *`, the table row is `button.laya-event.pw-table__row` and reads Blocked; it is selected without a click; `#event-info` shows the raw `BLOCK`, the reason "Recursive deletion targets…" verbatim, the command in mono, and Copy Command.
- [x] `js/chat.mjs`: table header and columns Time, Check, Decision (`stateGlyph`), Tool, Arguments; newest first; selection kept across refreshes, else the newest non-ALLOW/SUCCESS event; re-render only when the filter, selection or event ids change; `#event-info` with alert icon by outcome, reason, arguments, Decision, Check, Tool, Time, Proposal, Copy Command (toast "Command copied"); empty state "No checks yet" or "No checks match this filter".
- [x] `index.html`: `#event-info` gets its title bar and `#event-info-body`. `chat.css`: five columns, Event Info styles.
- Differs from the spec: no Project, From or Open Request. Laya events (`laya/ledger.py` `record_event`) do not record the project or the job; adding them is a ledger change, not a UI one.
- Not tested: the empty state, clicking another row, Copy Command's clipboard write.
