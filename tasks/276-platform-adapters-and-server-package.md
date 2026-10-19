# 276: The platform adapter interface, the in-process server adapter and the server package

Kind: code

Plan 253, section "The platform adapter interface". Adapters are maintained in the kit with contract tests and copied,
pinned, into a project's platform/ folder; the model never writes or edits them per app.

Files: kit/adapters/platform.py (the Protocols, the single source copied into app/platform.py), kit/adapters/server/
(storage.py, auth.py, network.py, run.py), kit/adapters/contract/ (the shared contract suite), kit/package.py
(`build(project, target) -> dist/<target>/`), harness tool or `plh package <target>` entry, tests/test_adapters.py,
tests/test_package.py.

- [ ] Red: the contract suite (storage: connect, migrate, commit, persisted after reopen; auth: anonymous, signed-in,
  `trusted`; network: get/post JSON against a local fake server; routing: a GET page and a POST fragment with 422)
  fails against the server adapter because it does not exist; `build(project, "server")` fails.
- [ ] Server adapter: file sqlite storage under the project (never the person's other folders), signed cookie session
  auth with the secret from the system keychain or the data folder (never the repository), httpx network, uvicorn run.
- [ ] `build(project, "server")` writes dist/server/ (the app, platform/server, a run script) and records the build in
  the decision log as code; Gate allows the build only in Implementation, inside the task.
- [ ] Every adapter declares its version; the project's platform/ copy records it, and a kit update offers the newer
  adapter as a task (never a silent overwrite).
- [ ] Green: the contract suite passes on a fake adapter and the server adapter; the packaged server starts on a free
  port in a scratch project and serves the starter's journey; the full workflow passes.

Acceptance: the same contract suite can be pointed at any adapter; the server package is built by code from the shared
source and runs.

## Scenarios

### US-new package the app as a server: dist/server is built and the packaged app serves its pages
Given a web app project in Implementation with an approved packaging task
When I ask to package it for the server (`plh package server`)
Then dist/server is written and the packaged app starts on a free port and shows the starter's pages

### US-new a kit update offers the newer platform adapter as a task, never a silent overwrite
Given a project whose platform/ copy holds an older server adapter version
When the kit ships a newer adapter
Then the workbench offers updating the adapter as a task, and platform/ is unchanged until I approve it
