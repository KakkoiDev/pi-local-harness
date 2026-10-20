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
