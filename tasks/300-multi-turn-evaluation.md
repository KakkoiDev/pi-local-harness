# 300: Benchmark ongoing development, not only first generation

Kind: code
No scenarios: bench scenarios and bench scoring are benchmark internals, not something the person sees or types in the workbench.

GPT-Sol's proposal: multi-turn scenarios (build, change a requirement, add a block, hit a failure, resume, export, reopen)
scored on preserved behaviour, completed journeys and human repairs. Runs need the person's yes.

- [ ] Two multi-turn scenarios in bench/scenarios with scripted person turns and journey checks.
- [ ] The bench reports preserved behaviour and interventions separately from first-generation success.
