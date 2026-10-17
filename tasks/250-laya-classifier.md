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
- [x] Ask the person before the downloads (the package from PyPI, `pip install laya-mlx` or `uv add`, and the model
  weights: name and size from the README). Pin the version in kit/toolchain.json; install it like the headless shell,
  under `plh setup` (harness/setup.py), into the data folder's toolchain, never into the repo.
- [x] harness/laya.py: one small module: `ask(kind, state, question, options=None, min_confidence=…)` returning
  `{answer, confidence, abstained}`; the model loaded once per process; a fake for tests (tests never load the real
  model, like they never reach Ollama).
- [x] The first questions, each a function with its own threshold and tests on recorded examples:
  - is this message a yes to the waiting question / plan / check-in? (choice: yes, no, change, something else)
  - which phase does the person ask for? (choice: discussion, planning, implementation, none)
  - is Pi assuming a value the person never gave? (noul, on Pi's last text and the request)
  - which guides apply to the request? (choice over harness/guides/)
  - how risky is this shell command? (score: read-only, writes in the project, writes elsewhere, dangerous), used by
    Gate only after its code rules did not decide.
- [x] Below the threshold: the person decides (a ChoiceCard, task 236), never the model (Article 2).
- [x] An evaluation set from the session logs and the bench (docs/lessons, ~/pi-local-harness-data/session.log
  read-only, no personal text committed: write the examples by hand from them), with accuracy per question recorded in
  this file; thresholds set so wrong answers above the threshold are rare.
- [x] Every Laya decision logged with its confidence (task 249).

## Result

The person approved laya-mlx 0.4.0 (99,307 bytes), the multilingual model (about 678 MB), and required dependencies
up to 100 MB. The resolved dependencies downloaded 79,387,414 bytes. kit/laya-lock.json pins every wheel, model file,
size and SHA-256; the model revision is f2b4faf51023039425946074e2cf1361d2db11d5. macOS 14-compatible MLX wheels are
also pinned; this Mac’s macOS 26 wheels were exercised. Nothing is installed in the repository. Setup reuses the
installed Python 3.12, forbids Python downloads and optional extras, and installs wheels offline after verification.

The typed questions have separate thresholds: waiting reply .98; phase intent .98; assumed value .98;
guide choice .95; shell risk .995. Code checks run first. A classifier interpretation cannot change a phase,
approve a plan or accept a task (the person’s clarification). Shell risk is advisory and never overrides a refusal.
After the explicit assumption rules, candidate decision language is checked by Laya before a code write.
This triage is not exhaustive semantic detection; ordinary implementation narration does not become a preference question.
An uncertain answer, or a detected assumption, uses the existing ChoiceCard directly. A person’s exact confirmation
can settle the same stated value; changed text requires a new check. Automatic recommendations never provide that
confirmation. Laya outcomes and abstentions record confidence in decisions.jsonl; task 249 extends other writers.

The offline evaluation uses 40 handwritten synthetic English/Japanese cases inspired by L-008 and the pong benchmark,
not copied private logs. Answers above the thresholds:

| Question | Correct / answered | Abstained / total | Wrong above threshold |
|---|---:|---:|---:|
| Waiting reply | 0 / 0 | 8 / 8 | 0 |
| Phase intent | 5 / 5 | 3 / 8 | 0 |
| Assumed value | 0 / 0 | 8 / 8 | 0 |
| Guide choice | 7 / 7 | 1 / 8 | 0 |
| Shell risk | 0 / 0 | 8 / 8 | 0 |

Answered accuracy: 12/12; coverage: 12/40 (30%). Abstention is not a correct answer. Unthresholded probes included
wrong answers with confidence .9606 (waiting reply) and .9691 (assumptions), so the conservative thresholds remain.
This small development set is not independent validation or a safety guarantee. Commands still obey the code gate.

Reproduce explicitly (ordinary tests use fakes, never MLX):
`python3 -m harness.laya_eval --data <isolated-data> --cases tests/fixtures/laya-evaluation.json`.

## Verification

Red runs covered the wrapper, typed questions, verified setup, decision ladder, direct choice presentation,
Japanese copy, Gate integration, request advice, assumption checks, runtime isolation, decision records and exact
human confirmation. Focused Python and Node suites pass. Both scratch browser suites passed (design and chat). The chained commit gate reruns the full Python and Node
workflow on the final tree; a failure prevents the commit.
