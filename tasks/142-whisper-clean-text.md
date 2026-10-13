# 142: Voice input gives only what was said

Kind: code

Request 2026-10-13 (phone screenshot): "the whisper shows "language detected english" ???" The prompt box read "Detected language: English / Just Detected language: English / Test". Cause: mlx_whisper prints the detected language unless `verbose` is None (False still prints), and `harness/web_chat.py transcribe()` used all of the script's stdout as the transcript.

- [x] Red (tests/test_remote_access.py): with a transcriber that prints other lines, transcribe() returns only the text.
- [x] harness/transcribe.py: `verbose=None`, library output to stderr, the result as one JSON line; transcribe() reads that line.
- Checked on this Mac with real mlx-whisper on a `say` recording: 'just a test of the microphone.'
