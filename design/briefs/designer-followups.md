# Designer follow-ups after the agent-scope round (2026-10-13)

Found while planning the build (tasks 127-141). The build takes the decision in brackets until you say otherwise.

- IMPLEMENTATION.md was not updated (View ⌘1–⌘4, titles Activity/Gate, Activity in the phone popup). [The repo updates it as each task lands.]
- SegmentedControl card still lists the four view tabs; Popup card lists block styles "Text … Checkbox" while DocumentBlock, P_Popups and PhoneEdit5 say Paragraph and Task. [Paragraph, Task.]
- StatusButton: card markup is a button, boards use a link; no "1 waiting" (queued only) state; attention always reads "Stopped"; A_Attention shows attention with Activity open although the card clears it then; priority of Working vs Attention unspecified. [button; "1 waiting"; the real state word; attention wins until Activity is opened.]
- InlineThread card: Ask Pi only before sending; Final and C_WorkDesk show it on answered threads. [Keep it: follow-ups work.]
- ContextLine order: card says plan first, comment boards put the file first. [File first for comments and whole-file requests.]
- ContextMeter card says the chosen context is not counted; Pi's usage includes it. [Show Pi's usage.]
- New Conversation alert has a non-safe default button. [As drawn.]
- No board for the read-only earlier conversation or the Earlier Conversations submenu; no address for it. [Built from the CompactionMarker card text.]
- The Gate fence icon is only inline in C_ProjectsWin, not in the icon set. [Copied into icons.mjs.]
- Returning from Activity/Gate: View ⌘1/⌘2 are disabled there; which view a project row opens is unspecified. [Close box returns to the last project page; a project row opens its Chat.]
- Activity empty copy says terminal Pi waits in the queue; terminal Pi does not use the queue. [Copy kept; noted.]
- G_Tablet keeps Project and hides Check/From in Gate; the 220px Projects window. [As drawn.]
- Board defects: S_Near (and other chat boards) show "[object Object]" in the composer; the meter reads "20 k" with a space.
