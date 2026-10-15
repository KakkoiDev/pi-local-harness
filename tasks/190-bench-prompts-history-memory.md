# 190: Bench: everyday prompts, the person's own requests, and the bug the first run found

Kind: code

Request 2026-10-15: "these are very specific prompts. how about more general prompts? like what I'm doing with you in
this chat?"

- [x] Prompt levels (precise, everyday, vague) for the five scenarios; `--prompt` (default everyday); each result records
  its level and prompt; the summary groups by level.
- [x] Three history scenarios from this repository: the commit before the request, the person's words verbatim, a
  behaviour check (browser at 1024×560; real Pi against a capture endpoint; Activity's record button), the real fix as
  `solution.patch`. `python3 -m bench check`: all eight fair.
- [x] The first real run solved nothing: every tool call said "Gate is unavailable". Red (node, extension test): a web
  worker whose memory file is missing still reaches Gate, the template stands in, and it is reported. Fixed in the
  extension (Gate's port set first; `memory()` falls back) and in the bench (it seeds AGENTS.md). The five invalid
  results moved to `results.invalid.jsonl` with the reason.
- [x] Browser tool steps wait up to 5 s for their element (a busy machine renders late); `startScratch` can start another
  checkout's services.
