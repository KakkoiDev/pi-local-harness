# Brief: models served by Colibri in the model menu

Date: 2026-10-22. Task: [294](../../tasks/294-colibri-models.md). Back end being built (discovery, choice, Pi provider);
the menu changes wait for this canvas.

The person: "I want to add in pi-local-harness the ability to load colibri models too."
[Colibri](https://github.com/JustVugg/colibri) runs very large mixture-of-experts models (GLM-5.x, DeepSeek V4, Kimi
K3, Qwen3.6/3.8) from the SSD on a Mac, through its own OpenAI-compatible server (`coli serve`). plh does not start or
stop it, as with Ollama; it connects to it on its own port (setting `colibri_url`, default `127.0.0.1:8100`, never
Gate's 8000).

## What changes in the model menu (`#model-button` / `#model-menu`, phone `#model-sheet-list`)

- **Two groups**: "Ollama" (today's list) and "Colibri". Each item: the model id, then its facts as today
  (tools, thinking, vision), each said in words.
- **Colibri not running**: the Colibri group stays visible with one disabled row: "Colibri isn't running at
  127.0.0.1:8100" and what to do ("start it with `coli serve --port 8100`"). Unavailable means disabled, never hidden.
  The same for Ollama when only Colibri runs.
- **A model without tools** (OLMoE, Inkling, or a family plh doesn't know): disabled (`aria-disabled`) with the reason
  ("can't call tools, so Pi can't change files with it"), as today's tools-less Ollama models.
- **Speed note**: Colibri streams experts from the SSD; a big model can be very slow on this Mac (GLM-5.3: 0.4 to
  1.9 tokens per second, minutes per answer, much longer for a whole task). Show it as a one-line note on the Colibri
  group or on the chosen model's facts, plainly, without blocking the choice.
- **Toast after choosing**: today "Ollama keeps only this model in memory." For Colibri: "Colibri serves one model;
  Pi now answers through <model> at 127.0.0.1:8100."
- **Status bar** (`#model`): the chosen model id; for Colibri, a short provider mark so the person can tell
  `glm-5.3` on Colibri from a same-named Ollama model.
- **Errors in the chat**: "Colibri isn't reachable at …" / "The connection to Colibri was lost" with Retry, as the
  Ollama errors do today.

## Terminal

`/models` lists both groups the same way (text only).

## Constraints

- The Pi WorkStation 1-bit family; no new component unless needed (a group heading in the menu).
- Each new control gets an e2e step; keep it to the items themselves.

## Acceptance (task 294's scenarios)

- A Colibri model is listed beside the Ollama models; picking it answers through it; the model used before stays
  selectable and untouched.
- A Colibri model without tools says so instead of failing silently.
- Colibri stopping mid-answer: the chat says the connection was lost and offers Retry.

## Follow-up: verified parallel labels (task 363)

The existing model-menu metadata now includes “parallel tested”, “serial in tested setup”, “parallel unknown” or
“parallel check failed”. Keep these beside model names and explain that current verified serving settings and
memory permit at most two requests in separate projects. Unknown/error results serialize. Review the text-only
extension of the existing metadata row on desktop and phone; no new control is introduced.
