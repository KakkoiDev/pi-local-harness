# ContextMeter

How full the project conversation is, at the right of the Chat window's status bar (the composer row stays for actions; the info bar for where you are).

- Markup: `<span id="context-meter" class="pw-meter" role="meter" aria-label="Conversation context" aria-valuemin="0" aria-valuemax="32" aria-valuenow="14" aria-valuetext="14k of 32k tokens">Context 14k of 32k<span class="pw-meter__bar" style="--pw-meter:44%"><span class="pw-meter__fill"></span><span class="pw-meter__line"></span></span></span>`.
- The bar is 64×8px, filled solid ink to the share used. A tick (`.pw-meter__line`) marks 60%: after the turn that passes it, the harness summarises earlier turns.
- States: **plenty** (below 50%): just the numbers. **near** (`.pw-meter--near`, 50% or more): adds “· earlier turns are summarised after this answer”. **just compacted**: the new, small number and “· summarised 14:01” until the next message is sent.
- The number is the usage Pi reports for its last turn (history plus that turn's chosen context), so it matches what the model actually saw. “k” is thousands of tokens, rounded down, with no space: “Context 14k of 32k”. Build the whole label as one string.
- Phone: in the Chat screen's footer line, without the bar.
