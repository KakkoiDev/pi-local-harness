# 301: Laya answers more questions, still safely

Kind: code
No scenarios: the evaluation set, thresholds, decision logging and Laya's cold start are classifier internals and metrics; the person's screens and commands do not change.

GPT-Sol's report: the first evaluation answered 12 of 40 cases (30% coverage, 0 wrong); the live logs: Laya abstained on
9 of 9 calls (0.49-0.83 against 0.95). Too many questions reach the person.

- [ ] A larger handwritten evaluation set (English and Japanese) per question, from the bench and the reviews, no personal
  text.
- [ ] Better typed questions and options (state shaping) before lowering any threshold; thresholds set from the set's
  error curve; coverage and errors recorded in this file.
- [ ] Constant code "recommendations" are not logged as decisions (with task 261).
- [ ] Laya's cold start fits within Gate's call timeouts (first judgement after a restart; review P3).
