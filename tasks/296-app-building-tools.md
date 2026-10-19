# 296: Checked tools that match app-building tasks

Kind: code
No scenarios: the checked tools are called by Pi and checked by Gate; the person sees and types nothing new.

GPT-Sol's improvement 4: checked operations for adding routes, creating migrations, running particular tests, inspecting
pages and assembling blocks, so a small model does less fragile shell work. Every operation passes through Gate.

- [ ] Define the first tools for the starter stack (add route + template, add a migration, run one test, inspect a page
  in the scratch browser, add a capability block), each with a schema and deterministic output.
- [ ] Gate checks each like the music tool; phases apply.
- [ ] Tests per tool, and one journey using them end to end.
- [ ] First tool: one harness `check` (offline: CSS build, types, tests, referenced files) returning a small verdict
  (first failure, file:line, a fix hint); on a fresh starter it is ok with no network (bug hunt proposal 1).
