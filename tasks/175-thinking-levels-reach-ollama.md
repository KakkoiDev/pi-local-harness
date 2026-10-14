# 175: The thinking level reaches Ollama; Off turns thinking off

Kind: bug

Question 2026-10-14: "I have a doubt that changing the thinking level in the UI actually changes the model's thinking
level."

Findings (Pi 1.1, Ollama 0.40.3; requests captured from real Pi with a fake endpoint, then measured on qwen3.8:27b-mlx):
- The menu's level does reach Pi (`--thinking <level>`) and Pi sends it to Ollama as `reasoning_effort`. Low made the
  model think less than High (406 against 501–628 tokens on the same question, fixed seed).
- **Off did not turn thinking off.** Pi sends no `reasoning_effort` for Off unless the model maps it, and Ollama then
  thinks by default (260 characters of reasoning on a one-line question; with "none": 0, in 0.5 s instead of 6 s).
- **Minimal** was sent as "minimal", which Ollama does not know: it thought as by default (611 tokens, Low 406).
- **Extra High and Max** are sent as "high": Ollama has nothing above it. Medium, High and no level measured alike on
  this question.

- [x] Red (node, core.test): a thinking model maps Off to "none" and Minimal to "low"; a model that does not think has
  no levels.
- [x] `harness/provider.mjs`: `thinkingLevelMap {off: 'none', minimal: 'low'}` on thinking models.
- [x] Real Pi against a capture endpoint: Off → "none", Minimal → "low", Low → "low", High and Max → "high".
- [x] The menu still offers Minimal, Extra High and Max, which now equal Low and High: asked the designer
  (`design/briefs/round-6-notes.md` item 17).
