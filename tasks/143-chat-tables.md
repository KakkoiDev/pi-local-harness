# 143: Markdown tables render as tables in chat

Kind: code

Request 2026-10-13 (phone screenshot): "tables don't display as tables on md". Pi's table showed as raw `| a | b |` text in a code box: js/message-markdown.mjs treated table paragraphs as raw blocks.

- [ ] Red (tests/harness/message-markdown.test.mjs, browser): a GFM table (header, `---` row, body; alignment colons) becomes a table with header cells and inline marks; a wide table scrolls inside its own box on a phone.
