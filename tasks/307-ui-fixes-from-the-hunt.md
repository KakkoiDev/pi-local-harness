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
