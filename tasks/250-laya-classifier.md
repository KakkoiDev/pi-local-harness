# 250: Laya: System 1's classifier

Kind: code

CONSTITUTION.md, Articles 2 and 5. The person, 2026-10-17: "I want to use this Laya as classifier
https://github.com/mizorewww/laya-mlx". laya-mlx (Apache-2.0) runs Laya typed-decision models on Apple Silicon with
MLX: it never generates text; it answers typed questions about a state (text, JSON or a conversation): `choice`
(probabilities over named options), `score` (ordered levels), `noul` (P(true) for a proposition), each with
`answer_confidence` and an optional `min_confidence` that makes it abstain. Models: ModernBERT-large 421M (English) and
mmBERT-base 322M (multilingual, 1,024 tokens; use this one: the person writes in English and Japanese). About 7-13 ms a
question. Python 3.11+, macOS 14+.

## Steps
- [ ] Ask the person before the downloads (the package from PyPI, `pip install laya-mlx` or `uv add`, and the model
  weights: name and size from the README). Pin the version in kit/toolchain.json; install it like the headless shell,
  under `plh setup` (harness/setup.py), into the data folder's toolchain, never into the repo.
- [ ] harness/laya.py: one small module: `ask(kind, state, question, options=None, min_confidence=…)` returning
  `{answer, confidence, abstained}`; the model loaded once per process; a fake for tests (tests never load the real
  model, like they never reach Ollama).
- [ ] The first questions, each a function with its own threshold and tests on recorded examples:
  - is this message a yes to the waiting question / plan / check-in? (choice: yes, no, change, something else)
  - which phase does the person ask for? (choice: discussion, planning, implementation, none)
  - is Pi assuming a value the person never gave? (noul, on Pi's last text and the request)
  - which guides apply to the request? (choice over harness/guides/)
  - how risky is this shell command? (score: read-only, writes in the project, writes elsewhere, dangerous), used by
    Gate only after its code rules did not decide.
- [ ] Below the threshold: the person decides (a ChoiceCard, task 236), never the model (Article 2).
- [ ] An evaluation set from the session logs and the bench (docs/lessons, ~/pi-local-harness-data/session.log
  read-only, no personal text committed: write the examples by hand from them), with accuracy per question recorded in
  this file; thresholds set so wrong answers above the threshold are rare.
- [ ] Every Laya decision logged with its confidence (task 249).
