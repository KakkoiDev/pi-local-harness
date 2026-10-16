# 249: Every decision logged with who took it; the bench measures the model's share

Kind: code

CONSTITUTION.md, Article 11: "Every decision is logged with who took it: code, Laya, the person, or the model. The
bench reports the share of judgements the model still makes. The target is zero."

- [ ] `<data>/decisions.jsonl`: time, request, kind of decision (phase, step done, box ticked, command allowed, answer
  to a question, guide chosen…), who (code rule id, laya + confidence, person, model), the answer.
- [ ] Gate, the paperwork and Laya write to it; a decision the model still takes today (e.g. Pi ticking a box with
  `task_box`) is logged as `model`, so the share is honest.
- [ ] The bench's result.json gets the counts per "who"; `python3 -m bench readme` adds a "model's share of decisions"
  column.
- [ ] Tests for each writer and for the bench column.
