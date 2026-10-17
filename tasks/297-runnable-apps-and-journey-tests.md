# 297: Generated apps stay runnable, with journey tests reused across targets

Kind: code

GPT-Sol's improvement 6: keep a working preview, and test complete journeys (create, edit, reload, recover) next to unit
tests, reusable across packaging targets (plan 253).

- [ ] Each starter ships a journey test runner (headless shell) and one journey per sample feature.
- [ ] The harness runs the project's journeys as part of verification when the task touches UI.
- [ ] The Preview shows when the app stopped working, with the failing journey.
- [ ] The browser tool defaults to the project's app inside a project, is a read in every phase, and the Preview's console
  errors are attached to the next turn (bug hunt item 19, proposal 4).
