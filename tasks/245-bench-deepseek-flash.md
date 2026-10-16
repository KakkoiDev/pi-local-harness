# 245: Bench DeepSeek Flash (later, when the person has set it up)

Kind: chore

The person, 2026-10-16: "I also want to do the benching with deepseek flash, I will provide a key" and then "let's not
do the deepseek right now. will setup later, make task for it."

Do not start until the person says it is set up.

- [ ] The person has set the DeepSeek key themselves (their shell profile or Pi's settings; the variable Pi reads for
  DeepSeek, from Pi's documentation). Never ask them to paste it; never print it; grep every commit for it.
- [ ] Find the exact model id for "DeepSeek Flash" (Pi's model list for its DeepSeek provider, or DeepSeek's API model
  list); if unclear, ask the person.
- [ ] Tell the person the number of runs (scenarios × with/bare × repeats) before starting: API runs cost money.
- [ ] Run exactly as task 244 does (same harness build if possible, every scenario, everyday prompts, with the harness
  and bare), keep the records in `docs/bench/<date>/` the same way, and add DeepSeek Flash as a row to the README table
  with `python3 -m bench readme`.
