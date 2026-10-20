# Approved offline quality and replay proof · 20 October 2026

## Downloads

The person approved Agentplay 0.2.1 (890,245 bytes, Apache-2.0) and Ruff 0.17.1's Apple Silicon wheel (9,270,361 bytes, MIT, below the approved 25 MB limit). Both wheel SHA-256 values were checked against PyPI before extraction; exact inventory is in `kit/quality-tools.json`. No runtime dependencies, global packages or browser were fetched for these two tools. The separately approved Phonon artifacts are recorded below. Tools live in `/private/tmp/pi-approved-tools-20261020/`; this scratch location can disappear on reboot. Nothing installs automatically.

## Ruff integration

`harness.quality.check(root, binary)` runs the explicit binary offline and read-only. It verifies Ruff 0.17.1 and selects F821 (undefined names), F822 (undefined `__all__` names), F823 (referenced before assignment), and E9 (syntax/input errors). Project Ruff configuration and `noqa` cannot weaken these fixed rules. It never passes `--fix`, imports project code or writes a cache/baseline. Findings have relative paths and locations. Missing/mismatched tools, scanner errors, malformed output, timeouts and unscoped diagnostics never produce a passing result. No Python source is reported as not applicable.

Scope: regular Python files under the selected root, excluding symlink files/directories, `.git`, `.venv`, `venv`, `node_modules`, `__pycache__`, `vendor`, `dist`, `build`, `design`, and repository `tests/fixtures`. More than 10,000 files fails explicitly. These are fixed initial exclusions: real source named build/dist/vendor requires a reviewed scope change. No suppression or baseline was introduced; the first 757-file repository scan had zero selected correctness findings.

```sh
PI_RUFF_BINARY=/private/tmp/pi-approved-tools-20261020/ruff/ruff-0.17.1.data/scripts/ruff python3 tests/verify_workflow.py
```

When explicitly selected, findings/unavailability fail the workflow. Otherwise it explicitly prints that Ruff did not run. This is staged rollout, not a mandatory multi-language gate. Nine checker tests and five workflow tests pass with the approved binary, including a latent bug stopping an otherwise passing workflow, clean source passing afterwards, syntax errors, no project-code execution, and failures/unavailability. JS linting, clone detection, broader Python rules, reviewed editable policy and publication/starter integration remain task 349.

## Agentplay compatibility

The opt-in `tests/proofs/agentplay_roundtrip.py` loads only the explicitly selected package and checks its version. A synthetic map with fixture timestamps contains a successful read, refused write and failed shell call. The normalized report retains all three states. The map counts two executed calls and shows refusal as a `gate_blocked` error rather than an executed write. Fake secrets and another project's call are absent.

Four real-tool tests pass: counts, explicit import round-trip, isolated loopback API/static viewer, and rendering the imported session in the bundled browser viewer without page errors. Discovery is forbidden during import; the store is scratch; signup/network features are disabled; non-loopback browser requests are blocked. Only the proof's own server is started/stopped. No personal log scan or recorded-command execution occurs.

```sh
AGENTPLAY_PROOF_PACKAGE=/private/tmp/pi-approved-tools-20261020/agentplay \
PI_PLAYWRIGHT=/path/to/existing/node_modules \
PI_TEST_CHROME=/path/to/existing/chrome-headless-shell \
python3 tests/proofs/agentplay_roundtrip.py
```

Agentplay 0.2.1 has no native Pi parser. Import/viewing are proven, but a production Pi-to-map adapter is not shipped. The normalized core omits timestamps: wall-clock timing must not be invented from record order. Missing results, Activity's 200-call retention/detail limits and Gate argument truncation need honest unknown/truncated states. Incomplete/conflicting receipt rendering, faithful Gate decisions, selection/export and designed WorkStation integration remain task 350. This proof is not a complete audit viewer.

## Verification and review

Set `PI_TEST_RUFF` to the approved binary for real-tool checker/workflow tests. Installed-copy tests include the checker and manifest. Task 353 records the final full workflow/browser results. Claude should review the fixed exclusions, explicit opt-in rollout and policy-refusal representation before wider integration.

Phonon-2 remains uninstalled and untested: runtime/model artifacts are approved and downloaded, but dependency approval is pending. Multilingual Whisper remains the default. No accuracy or speed claim is made.

## Actions panel direction

The person's latest clarification is that analysis belongs neatly in the existing Actions panel to improve log observability. Standalone upstream rendering is only a compatibility milestone. Plan 348, task 350, the Claude handoff and round-16 designer brief carry the requirement; new panel controls await approved design.

The person approved and we downloaded runtime 0.2.12 (1,406,464 bytes) and pinned model revision `fb09063c9dc8e130d97b3a2191ed5aed6b71bb31` (packed weights 163,515,201 bytes), with a 170 MB limit. Task 351 records hashes and publisher sources. The artifacts total 164,956,175 bytes, below the approved 170 MB limit. The wheel and packed weights match their published hashes; downloaded config/licence files also match the publisher checksum manifest. Files remain in `/private/tmp/pi-phonon2-approved-20261020/`, without installation or model execution. Dependencies remain unresolved/unapproved; the runtime declares Torch and Transformers even when MLX extras are selected, so an MLX-only small dependency set must not be assumed.
