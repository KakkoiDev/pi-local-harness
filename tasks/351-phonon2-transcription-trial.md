# 351: Trial Phonon-2 for local English transcription

Kind: code

See [plan348](../docs/plans/348-quality-traces-and-phonon.md), section3. Trial first; no global English-only replacement for multilingual Whisper.

- [ ] Inspect/pin the Python3.12/MLX or separately evaluated Core ML route; list model/runtime/dependencies, sizes/checksums/licences and obtain download approval before installing locally.
- [ ] Red: provider-contract, web/terminal entry points, no-speech, malformed stdout, invalid audio, unsupported languages, timeout/cancellation and missing-model/no-download tests.
- [ ] Add the provider-neutral transcription adapter preserving clean JSON text, lazy loading, local processing, bounded execution and retry without duplicate submission.
- [ ] Preserve Whisper for Japanese/unsupported languages and rollback; specify explicit language/backend selection before any production default change. Obtain designs for new controls.
- [ ] Measure both engines on approved English clips, record WER/CER, cold/warm and end-to-end latency, memory, errors and actual artifacts; never infer performance from vendor figures.
- [ ] Green: offline real smoke tests and unit/integration/designed E2E for recording, attachments, editable text, cancel/retry and terminal audio; workflow passes.
- [ ] Publish the trial result and explicit default/rollout decision; do not mark unrun language/OS cases passed.

## Scenarios

### US-new English dictation through the trial provider inserts editable text once
Given an installed approved Phonon backend selected for English and a known recording
When I transcribe it in the workbench
Then recognized text appears once for editing without model diagnostics or automatic sending

### US-new Japanese audio retains multilingual transcription
Given Whisper is installed and selected for Japanese
When I transcribe a Japanese recording while the English Phonon trial is available
Then Japanese text is preserved and the English-only model does not replace that selection

### US-new a missing speech model or cancelled transcription leaves retry usable
Given a transcription is unavailable or in progress
When it fails or I cancel and then try an installed backend
Then the error or cancellation is clear, no automatic download occurs and the next transcription succeeds without duplicate text

## Metadata inventory · 20 October 2026

The person approved the runtime/model downloads. Downloaded and checksum-verified artifacts total 164,956,175 bytes in `/private/tmp/pi-phonon2-approved-20261020/`; no installation or execution has occurred. Inventory: `fermion_research-0.2.12-py3-none-any.whl` (1,406,464 bytes; SHA-256 `2316c710d03a2b3832271fcff91d997aded5fbe9aca51cadd75f8a16a2f03c71`) and model/config files at `FermionResearch/Phonon-2` revision `fb09063c9dc8e130d97b3a2191ed5aed6b71bb31`, within 170 MB total. Packed weights `phonon-2.bps.tar.zst`: 163,515,201 bytes, LFS SHA-256 `98125795b6dda72f5c6eee9ba33d19815df65dcb18b50a357bf9f73c9935309e`.

Publisher metadata: the runtime is Apache-2.0; weights are CC-BY-4.0 with NOTICE. The Python package declares Torch, Transformers, NumPy, Hugging Face Hub, Safetensors, SoundFile, SciPy and Zstandard even before MLX extras; extras add MLX, mlx-audio and mlx-lm. Do not assume an MLX-only tiny install, bypass dependency checks, execute fetched model Python, or download these dependencies under the two unrelated Ruff/Agentplay approvals. Resolve, pin, size and obtain separate approval first. Existing local caches can be inventoried read-only. Whisper and Japanese support remain unchanged.

Sources: [runtime metadata](https://pypi.org/pypi/fermion-research/0.2.12/json), [pinned model tree](https://huggingface.co/FermionResearch/Phonon-2/tree/fb09063c9dc8e130d97b3a2191ed5aed6b71bb31).
