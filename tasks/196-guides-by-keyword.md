# 196: Short guides that join the prompt when a request calls for them

Kind: code

Strategy 5 of the ones picked on 2026-10-15, after OpenHands' keyword-triggered microagents: know-how where it applies,
a short base prompt everywhere else.

- [x] Red (node, `tests/harness/guides.test.mjs`): every guide has triggers and stays short; a request gets the guides
  its words call for, at most two, the most matched first ("the view is lifted… white at the bottom" → page-layout,
  "Rename … everywhere" → rename, "I have a doubt…" → doubt; "page 2" of results is not a web page).
- [x] Red (node, extension test): the guide joins the prompt for that request only, and is reported (`guide`).
- [x] `harness/guides.mjs` and four guides from the lessons: page-layout (L-008), bug (reproduce first, L-006), rename,
  doubt (answer with evidence). Not in bare mode. Lesson L-008 updated.
