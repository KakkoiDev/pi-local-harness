# 140: Document blocks follow the DocumentBlock card

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (browser): pw-block--{type}, pw-block__content, empty placeholder "Write, or choose a style in the ruler" ("List item" in lists), .pw-doc__tail, handle labels "{Type} options", names Paragraph, Heading, Task, Bullet, Number, Quote, Code, Raw Markdown; toast "Task deleted."

Done 2026-10-14: blocks render `pw-block pw-block--{paragraph|heading|task|bullet|number|quote|code|raw}` with `data-type`, content `.pw-block__content`, an empty block `.pw-block--empty` with its placeholder ("List item" in lists), handles "{Type} options", the page tail `.pw-doc__tail`; chat.css's old `.quote/.code/.block-content` rules are gone (one `.pw-block--raw` rule added: components.css styles only `--code`, told the designer). Toast "Task deleted." and type names came with task 150.
