# 112: Block types look different in the editor

Kind: code

Request 2026-10-13: "quotes and paragraphs look the same way." Found with it: bullet and numbered blocks show no marker, code blocks no frame; the editor renders every type as a plain `.block-content`, while the design styles `.pw-doc blockquote` (dotted frame, italic), `.pw-doc pre` (ink frame, mono) and list markers.

- [x] Red (tests/browser/design.cjs): quote is italic in a dotted frame; bullet shows "•" and numbers count 1, 2 within a run; code has an ink frame in the mono face; the markers are not part of the block text.
- [x] Block styles in chat.css from `.pw-doc blockquote` / `.pw-doc pre`; list markers as `.pw-block__marker` (aria-hidden) from renderBlocks.
- Found while checking: clicking below the last block saved an empty paragraph as a blank line (it changed the user's test ROADMAP.md through the dev copy; restored byte for byte). `serializeMarkdown` drops empty new paragraphs (red: tests/harness/markdown.test.mjs). The dev server now runs on a copy of the project.
