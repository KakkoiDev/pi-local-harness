# 133: Server: the context preview Pi will get

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (python): build_context items carry kinds (plan, tasks, this file, mentioned, related) and the open-task count; the preview returns exactly what a request would send (`tests/test_context.py`, `tests/test_web_chat.py`).
- [x] `GET /api/context-preview?project=&text=` (plus `document=`, or `path=&comment=` for a thread) as IMPLEMENTATION § B draws it (GET, not POST): `{items:[{label, path?, kind, count?}], tokens}` from `WebChat.select_context`, the function the request itself uses. For comments and whole-file requests the current file leads. A document from another project is refused.
- [x] Green: python and node suites (verify_workflow).
