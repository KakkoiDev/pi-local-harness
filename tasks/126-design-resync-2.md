# 126: Re-sync the design after the agent-scope brief

Kind: chore

Request 2026-10-13: "design updated" (both artifacts), answering the brief in task 119.

- [x] `design/canvas/`: every board and canvas.json from the canvas (new: C_ProjectsWin, C_ProjectWin, Projects, MB_Status, G_Tablet, S_Fresh, S_Near, S_Compacted, S_Summary, S_NewConversation, W_Blocks, W_Comment); the stylesheet upload is now `_blob/0bee260e58c72bbc496b29ca68796cdc.css` (the old one removed).
- [x] `design/system/`: the designer's README, tokens, design-system.json, bundle.css and every card (new: StatusButton, ContextLine, ContextMeter, CompactionMarker; updated: DocumentBlock, InlineThread, ListGroup, Menu, MenuBar, Message, Popup, ReviewItem, SegmentedControl, ToolCall). The repo's earlier card notes are folded into the designer's versions.
- [x] `design/components.css` rebuilt from the new bundle plus the four repo additions.
- [x] One design change the build already follows by CSS: the inline thread is full column width with no indent (InlineThread card); tests/browser/design.cjs updated from 24px to 0.
- [x] Green: unittest, node --test, both browser suites.
