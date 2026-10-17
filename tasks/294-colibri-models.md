# 294: Models served by Colibri

Kind: code

GPT-Sol's report, owner request 2026-10-18 (task 258 recorded it): support models served by
https://github.com/JustVugg/colibri alongside Ollama and online providers.

- [ ] Inspect a local Colibri install read-only, if any; pin the tested upstream revision; ask before any download
  (runtime, build dependencies, weights) with versions and sizes.
- [ ] Select the Colibri endpoint and an installed model without changing the current provider; a free port (its example
  uses 8000, Gate's port); never stop an unrelated service.
- [ ] Verify discovery, streaming, tool schemas and round trips, finish/error, cancellation, connection loss; report
  unsupported capabilities honestly.
- [ ] Adapter unit tests, a local stub-server integration test, a browser journey; a real-model smoke test only with the
  person's yes.
