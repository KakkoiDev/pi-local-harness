# CompactionMarker

Where the harness summarised a long conversation, in the Chat transcript, after the last message it summarised.

- Markup: `<details class="pw-compacted"><summary><span class="pw-compacted__label">Earlier conversation summarised · 14:01 · 38 messages <span class="pw-compacted__toggle">Show Summary</span></span></summary><div class="pw-compacted__body">…</div></details>`. Double rules either side, like an info bar; the toggle text becomes Hide Summary when open.
- The messages above stay on screen for the person, unchanged. The marker says what changed for Pi: the first line of the body reads “Pi now remembers everything above as this summary. The messages stay here for you.”, then the summary text the harness wrote (Markdown, rendered like a Message body).
- Compact Now (Agent menu) adds a marker at once and shows the toast “Conversation summarised.” with no Undo; the meter drops to the new size.
- New Conversation… starts an empty transcript whose first line is `.pw-convline`: “‹ Earlier conversation · 13 Oct · 84 messages · kept, read only”. The link opens the old one read only (composer hidden, info bar “Earlier conversation · read only” with Back to Current). Agent › Earlier Conversations ▸ lists all of them, newest first.
