# ChoiceCard

Pi asks one question before it builds (plan mode, plan 236). Boards: R10_Choice, R10_ChoiceStates, Ph10_Choice, T_PlanMode.

- Markup: `section.pw-card` inside Pi's message. Head: ? glyph, `h3.pw-card__title` (the question), “Question 1 of 3” at the right. Body: `role="radiogroup"` of `label.pw-option` rows: `.pw-radio`, the label, an optional `.pw-tag` “Recommended”, an optional one-line `small` detail. Foot: **Answer** (default) and “or type your answer below”.
- 2–4 options. The recommended option is always first and selected. **Something else…** is always last; choosing it opens a field in the card.
- **One question per card**, asked one after another (each answer can change the next). No “Let Pi choose” button: Answer with the preselected option is that.
- **Typing in the composer** while a question waits answers it as Something else: the composer's label reads “Your answer to “<question>” (or choose above)” and Send reads **Answer**.
- **Settled** (`.pw-card--settled`): one `.pw-card__line`: ✓, “Who writes: **only you, on your devices**”, who and when, **Change…**. The person's own words are quoted (“· your words”).
- **Auto** (`.pw-card--auto`, dotted, no shadow): the same line with a dotted `auto` tag; Change… asks Pi to redo what depended on it.
- Inline on the phone too (not a sheet): 44px rows, 22px radios.
- Terminal: Pi's select list, “Recommended” dim at the right, then one line “✓ Who writes: …” or “~ Sorting: newest first · auto”.
- `.pw-tag` is shared: Recommended, chosen, given, auto (dotted).
