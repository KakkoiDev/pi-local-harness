# 249: Every decision logged with who took it; the bench measures the model's share

Kind: code

CONSTITUTION.md, Article 11: "Every decision is logged with who took it: code, Laya, the person, or the model. The
bench reports the share of judgements the model still makes. The target is zero."

- [x] `<data>/decisions.jsonl`: time, request, kind of decision (phase, step done, box ticked, command allowed, answer
  to a question, guide chosen…), who (code rule id, laya + confidence, person, model), the answer.
- [x] Gate, the paperwork and Laya write to it; a decision the model still takes today (e.g. Pi ticking a box with
  `task_box`) is logged as `model`, so the share is honest.
- [x] The bench's result.json gets the counts per "who"; `python3 -m bench readme` adds a "model's share of decisions"
  column.
- [x] Tests for each writer and for the bench column.

## Result

Gate records permission and audit outcomes with request IDs and a rule/code identifier. The paperwork records plan
layout and approval, evidence-based box ticks and verified completion, question recommendations/answers and task
acceptance. Phase changes distinguish the person from automatic code. Guide attachment records its code identifier;
Laya’s question outcomes and abstentions retain confidence. The append-only file is created with private permissions.
Inputs, shell commands, prompts, guide text and free-text answers are excluded; a question answer records an option
index or “other”. A control outside a message has a null request, rather than an invented message ID.

The current model still orders the options it proposes to ask_choices. That recommendation is honestly recorded as
model; a person’s choice, or code selecting the automatic recommendation, is a separate decision. System 1-owned
fallback cards are attributed to code. The target is zero model judgments, not a claim that the current share is zero.
There is no model-owned checkbox tick: task_box has been blocked since task 247.

New benchmark results retain decisions.jsonl and decision_counts per author. Missing historical provenance is null,
not four zero counts. The README column counts the harness runs, shows model/total decisions and recorded/total runs,
and says “Not recorded” for legacy batches. These counts cover instrumented runtime decisions, not every latent
choice inside generated prose; the metric is not a proof that a model made no unstated judgment.

Red tests failed for each missing writer and benchmark count/column. Focused writer, classifier, phase and guide tests
pass; the chained workflow gate reruns the full Python and Node suites before committing. No real benchmark was run.

Follow-up coverage: immediate code answers and reuse of an exact person-confirmed value are recorded too. The new
regression failed because no log existed, then passed with both code rules recorded and private inputs excluded.
