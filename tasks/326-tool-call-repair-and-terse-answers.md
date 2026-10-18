# 326: Fix the tool calls small models write as text, and make every model answer tersely

Kind: code

Request 2026-10-18: "let's find a way to make the 4b model use tools like it is advertised it should be able to. add a transformer that catches poorly made tool calls and formats them properly." and "make sure you make all models go terse in their answers like for the colibri-poc project with the benches."

Evidence (the owner's Workbench, read only): Pi reaches Ollama 0.40.6 through the OpenAI-compatible API (provider
`ollama`, api `openai-completions`). In a real chat gemma4:e4b-mlx and gemma4:26b-mlx wrote their tool calls as text
(`<execute_tool>\nread{path:app/db.py}\n</execute_tool>`, `<call> read(path="app/db.py") </call>`, a bare
`read(path="app/db.py")` at the end, and `<execute_tool>\nwrite{content:"""…""",path:app/db.py}\n</execute_tool>`):
1 real toolCall in 14 assistant turns, and the job "completed" with nothing done. The same model returns proper
`tool_calls` when asked directly with a `tools` array, so it can; it imitates its earlier pseudo calls.

- [x] Red (unit): tests/test_tool_repair.py and tests/test_tool_repair_proxy.py failed before the change (no `harness.tool_repair`, no proxy); tests/harness/tool-repair.test.mjs failed (no `harness/tool-repair.mjs`, no terse instruction).
- [x] Parser, System 1 (`harness/tool_repair.py`): the four texts above, plus `<tool_call>{json}</tool_call>`, ```tool_code / ```json / ```python fences, Gemma's `<|tool_call>call:read{path:<|"|>…<|"|>}<tool_call|>`, `name(arg=…)`, `name{key:value,…}`, Python triple-quoted strings (file content with its own docstrings kept as written). Wrappers count anywhere; json/python/plain fences and bare calls only when they end the answer. Arguments are checked against the tool's JSON schema (no unknown keys, every required key, types coerced only when unambiguous). Never a call for a tool not offered, from prose that mentions a tool, or from a code sample; an unreadable or invalid call stays text and is reported.
- [x] Proxy (`harness/tool_repair_proxy.py`) in front of Ollama's /v1, started and stopped by harness/services.py (one per workbench, `tool_repair_port`, 0 = a free port and the default; an occupied port is a plain message; tests use port 0; `tool_repair: false` turns it off). Proper tool_calls and requests without tools pass through unchanged; a repair rewrites content, `tool_calls` and finish_reason "tool_calls", streamed or not. Streams keep flowing: thinking and prose go out at once, only text that may be a call is held (its chunks still go out, emptied, so Pi sees activity), then re-emitted as valid SSE. Errors keep their status; a timeout is 504 (mid-stream: the stream ends without a finish); an unreachable Ollama is a 502 that says so.
- [x] Pi points at it without touching the person's `~/.pi` files: the extension registers the `ollama` provider with the proxy's address for this Pi only (`harness/tool-repair.mjs`): web workers get `PI_HARNESS_TOOL_REPAIR_URL`, terminal Pi reads `repair` from the services' ready line and re-registers (Pi 1.1.0 applies a runtime registration at once). Only a provider that points at the workbench's own Ollama (`ollama_url`) is routed. Nothing to back up or restore: models.json is never written.
- [x] Log: each repair is a `tool_call_repaired` decision by code, automatic, rule `tool_repair`, with model, tool, pattern and the harness request (the extension adds `_pi_harness_request`; the proxy removes it before Ollama); a call left as text is a `tool-repair-failed` line in reports.jsonl. No arguments, file contents or answers are logged.
- [x] Capability honesty: the model menu says "tools" only for models Ollama lists with the tools capability ("no tools" stays disabled). Activity: the request shows "Tool calls fixed: N written as text by <model>, run as real calls (<tools>)", and a model with repairs in 3 requests within 14 days is named in a note above the list (`harness/tool_repairs.py`), never a blocking card.
- [x] Terse answers for every model (`harness/terse.mjs`), added to the shared system prompt of every web and terminal session (not the bench's bare baseline): "Answer as briefly as possible." with direct answers, no restated request or plan, no filler; questions stay ask_choices cards; errors, verification, required controls stay complete; code, evidence and tests are never shortened; [CANARY] and "For the person" still apply. Adapted from colibri-poc's `styles.terse` (" Answer as briefly as possible. For code, reply with only the code.").
- [x] Measure: the bench records `answer_words` (the final answer's words, without the canary and the G-012 note) and `tool_repairs` per run, and the summary shows their median and mean. No real model runs were made.
- [x] Docs: harness/GUIDE.md ("Why does Pi fix small models' tool calls?", `/guide repair`), docs/reference.md (architecture), harness/README.md (settings), docs/user-stories.md (US-230 to US-232, counts), Japanese strings, designer note in design/briefs/round-13.md.
- [x] Green: tests/test_tool_repair.py (28), tests/test_tool_repair_proxy.py (17, fake upstream: stream and non-stream, passthrough, repair, thinking, errors, timeouts, unreachable, the Activity annotation, the services’ lifecycle and port), tests/harness/tool-repair.test.mjs (3), tests/test_bench.py, stories.cjs US-230, the workflow check and all browser suites.

Not done here: the one-shot "use the real tool" nudge and keeping pseudo-call text out of the model's history belong to
the chat-path task (branch fix/chat-critical-path); when a repair fails, this proxy leaves the text for that nudge.
Whether terse answers are shorter with a real model is not measured yet: run the bench (`python3 -m bench run`) and
compare `answer_words` with an earlier build.

## For the person

When a small model such as gemma4:e4b-mlx writes a tool call as text, the workbench now turns it into a real call, so
the file is actually read or written; Activity says "Tool calls fixed". Every model is also asked to answer briefly.
Tried it: a stand-in model that answers with `<execute_tool>read{path:notes.md}</execute_tool>` made the read run.
