# 307: UI fixes found by walking the workbench

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Items 11, 21, 22, 23, 24.

- [ ] The status shows Working while a web request runs (not Ready).
- [ ] Japanese: translated menu rows stay translated (.pw-row__label must not be skipped for the workbench's own
  labels), "Why?", "Tasks", "Choice: … →", "your words · you" translated, "1 tasks" pluralised, #phone-more's label named.
- [ ] Phone 390 px: no π-menu overflow in Japanese, Work checkboxes and "show more" at 44 px, chat tables scroll instead of
  breaking words.
- [ ] Choosing a model while Ollama is down says so in the Work view too.
- [ ] Browser tests for each.

## Round 12 (design round 12 step 8; boards R12_Fixes, R12_Strings)

- [x] Markdown links in Work are links: a ROADMAP task line `[…](tasks/…)` opens the task file; ⌘-click opens a new tab;
  the source shows on focus (js/work-links.mjs).
- [x] The ChoiceCard does not repeat its question: Pi's text drops a line or sentence equal to it (js/choice-text.mjs).
- [x] The composer while Pi works: Stop · Queue, and the hint “Pi answers after the current request.” (“<project> · send
  to agent queue” is gone).
- [x] The status names the project: “Working on <project>” (18 characters, then “…”) on the desk; the phone keeps “Working”.
- [x] The phone π sheet's buttons stack when a label is wider than half the row (Japanese).
- [x] Appearance: Match System is the default; Paper and Inverse stay deliberate choices (“…, always”).
- [x] Every new string in English and Japanese (messages/ja.json, R12_Strings).
- [x] Browser stories US-123 (a link in Work opens the task) and US-124 (⌃⌥ shortcuts).
