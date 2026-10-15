# 185: Pi keeps running: wake-ups, Gate failures that do not stop the run

Kind: code

Plan 184 part 2: "I would rather that the AI agent continue its run. I don't want to baby-sit it." "I want the gate to
wake it up when it goes idle mid-run, loops, etc."

- [x] Red (node, extension test against the real Gate): a Gate failure blocks only that call (the turn is not aborted)
  and is reported; recoveries are reported; a turn that stops with code changed and no passing test is woken
  ("Continue (harness wake-up 1 of 1)…") and, out of wake-ups, marked "Not verified"; an answer that asks the person
  something, or a turn the person stopped, is not woken.
- [x] `wake_ups` setting (`PI_HARNESS_WAKE_UPS`, default 5, 0 for no limit) bounds recoveries and wake-ups per request
  (recovery was once).
- [x] G-011: Gate checks are retried after 1, 3 and 6 s on a missing answer or a server error (not on a 4xx); then that
  call is blocked with "you may continue", the person sees a notice, the failure is reported. Rule text and the prompt
  summary updated; lesson L-002 updated.
- [x] Web workers read the verification too, wait 2 s after Pi settles (room for a wake-up, which reuses the recovery
  notice), and report their own "Not verified" answers.
