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
