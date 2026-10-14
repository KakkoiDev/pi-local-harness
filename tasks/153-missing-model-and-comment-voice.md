# 153: A removed model falls back; voice input in comments; the thinking menu keeps its width

Kind: code

Request 2026-10-14: "i tried to chat and the model never answered", "I want to be able to do voice input in the comments", "when clicking repeatidly on the thinking level, the pane keeps getting wider".

Cause of the first: the chosen model (`qwen3.8:27b-mlx`) was in another Ollama models folder. `~/.zprofile` sets `OLLAMA_MODELS=$HOME/models/ollama`; Ollama restarted from a shell (during the task 67 experiment) used that folder, the login-started app uses `~/.ollama/models`. Every request then failed with Ollama's raw 404.

- [x] Red (unit): a chosen model Ollama does not have falls back to the default (`missing` names it); with Ollama unreachable the choice is kept; Ollama's "model not found" reads as a sentence with the `ollama pull` command; terminal `plh` falls back the same way (`models.effective`).
- [x] The page toasts "<model> is no longer installed in Ollama. Pi uses <default> until you choose another model." and the menu bar shows the model that runs.
- [x] A comment whose last request failed, stopped or was interrupted reads "Pi could not answer" in Review, offers Ask Pi again and counts in Send N Unsent.
- [x] Voice input in comments (`js/dictation.mjs`): a Dictate button next to the comment composer, each thread's reply field and the whole-file question records, the Mac transcribes, the text lands at the cursor; a recording survives a thread re-render; the microphone is released on errors.
- [x] The thinking (and model) menu keeps its width: an end-aligned menu sets only its right edge.
- [x] Green: unit, both browser suites (fake microphone; transcription answered by the test).

Not designed yet: the Dictate button in comments; add it to the next designer brief.
