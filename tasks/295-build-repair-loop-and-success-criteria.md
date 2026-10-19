# 295: A reliable build-and-repair loop with executable success criteria

Kind: code

GPT-Sol's improvements 1 and 2, endorsed by the person: recover from failed commands, interrupted requests and broken
tests while keeping the goal and decisions; requirements become observable examples ("after reloading, the note keeps
its priority") that System 1 runs before completion.

- [x] Planning writes each task's Done when as executable examples (a test name per example); the plan card shows them.
  (Task 329: the task's Given/When/Then scenarios, each one test named after its title.)
- [x] Completion needs those examples' tests passing on the final code (builds on task 260), not any passing test.
  (Task 329: every scenario's test passed on the final code in a run Gate saw, else "not verified" naming it.)
- [ ] A failed command or test keeps the request going with the failure as context (bounded wake-ups), and an
  interrupted request resumes from recorded state.
- [ ] A journey test: describe an app, build it, change it twice, break it, recover, without manual repair.
