# 294: Models served by Colibri

Kind: code

GPT-Sol's report, owner request 2026-10-18 (task 258 recorded it): support models served by
https://github.com/JustVugg/colibri alongside Ollama and online providers.

- [x] Inspect a local Colibri install read-only, if any; pin the tested upstream revision; ask before any download
  (runtime, build dependencies, weights) with versions and sizes.
- [ ] Select the Colibri endpoint and an installed model without changing the current provider; a free port (its example
  uses 8000, Gate's port); never stop an unrelated service.
- [ ] Verify discovery, streaming, tool schemas and round trips, finish/error, cancellation, connection loss; report
  unsupported capabilities honestly.
- [ ] Adapter unit tests, a local stub-server integration test, a browser journey; a real-model smoke test only with the
  person's yes.

Request 2026-10-22: "I want to add in pi-local-harness the ability to load colibri models too". Inspected read-only:
`~/Code/colibri` at `bf244291` (installed engine), `coli serve` = `c/openai_server.py`, OpenAI-compatible
`/v1/models` (id, input_modalities, capabilities) and `/v1/chat/completions`; no tool-support flag, so tool support
comes from the model family as Colibri documents it (GLM, DeepSeek V4, Kimi K3, Qwen3.6, Qwen3.8 call tools; OLMoE and
Inkling do not; an unknown family is reported as no tools). Its default port 8000 is Gate's: plh uses its own setting.
plh does not start or stop Colibri, as with Ollama.

Back end (this round, no UI):

- [x] Red (unit): a stub Colibri server; `/api/models` lists its models with provider `colibri` beside Ollama's; an
  unreachable Colibri leaves Ollama's list intact and says why; the choice saves provider and model; Pi starts with
  `--provider colibri`; a Colibri model without tools is refused like an Ollama one (`tests/test_colibri_models.py`).
- [x] Red (node): the extension registers a `colibri` provider at the Colibri URL with the listed models.
- [x] Settings: `colibri_url` (env `PI_COLIBRI_URL`, default `http://127.0.0.1:8100`), validated like `ollama_url`.
- [x] `harness/model.py`: Colibri discovery and capabilities, provider in the saved choice, switching without Ollama's
  keep_alive.
- [x] `harness/web_chat.py`: the model list and choice use the provider; connection errors name Colibri.
- [x] `harness/provider.mjs` / `harness/extension.mjs`: register `colibri` (OpenAI completions API, any key).
- [ ] Designer: `design/briefs/colibri-models.md` (the model menu with Colibri, its unreachable state, slow-model note).
- [ ] UI and the three stories after the canvas; docs (README, reference, harness/README, GUIDE).

## Scenarios

### US-new choose a model served by Colibri: the current provider stays until I pick it, and the chat answers through it
Given a Colibri server is running on a free port with one installed model
When I open the model choice and pick that Colibri model
Then it is listed beside the Ollama and online models and my next message is answered with streaming text
And the model I used before stays selectable and untouched

### US-new a Colibri model that cannot call tools says so instead of failing silently
Given a Colibri model without tool support is selected
When I ask Pi to change a file
Then the chat says the model cannot use tools and names what to choose instead

### US-new Colibri stops mid-answer: the request fails with why and Retry
Given Pi is answering through a Colibri model
When the Colibri server stops
Then the chat says the connection to Colibri was lost and offers Retry, and the chat goes on after it

## Progress

- 2026-10-22: back end done, no UI. `colibri_url` / `PI_COLIBRI_URL` (default `http://127.0.0.1:8100`); Colibri
  discovery from `/v1/models` with tool support from the family; `/api/models` lists both providers with `provider`
  and `unavailable`; `POST /api/model` takes `provider`; the choice saves `{provider, model, effort}` (old files mean
  Ollama); Pi and terminal Pi start with `--provider colibri`; the extension registers a `colibri` provider; terminal
  `/models` lists Colibri's models or says it is not running; connection errors name Colibri. Tests: 18 in
  `tests/test_colibri_models.py`, 5 in `tests/harness/colibri-provider.test.mjs`; every suite's Colibri address is a
  closed port. Green: Python suite (1051 tests), `tests/verify_workflow.py` (dogfood, node --test, unittest).
- Not done or not verified: the browser suites did not run on this machine (Playwright not installed: "Not run");
  the model menu's Colibri group and the three stories wait for the canvas (`design/briefs/colibri-models.md`);
  streaming, tool round trips, cancellation and connection loss against a real `coli serve` are untested (live smoke
  test only with the owner's yes).
