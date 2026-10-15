# Plan 184: Autopilot: the harness does the paperwork and keeps Pi working

Request 2026-10-15: "I would rather that the AI agent continue its run. I don't want to baby-sit it. Then we analyze all
the reported errors and make the harness better." "What I want is to automatize all the paperwork: Roadmap and Task
format + guardrails. The model's only job should be to produce content: documentation, bug hunt, code, etc." "I want a
button in the web UI when the model genuinely stopped, like crashed or something. But I want the gate to wake it up when
it goes idle mid-run, loops, etc. I want the agent to be able to do all the work I asked it to do."

Status 2026-10-15: built as tasks 184 (reports), 185 (keep running), 186 (Ask Pi to Retry…) and 187 (paperwork, with
rule G-013: Pi does not commit within a request). Not yet seen with a real model.

Decisions (2026-10-15): the harness commits locally when the work is verified (never pushes); a task is made at the
first file change (or the request's named task is reused); up to 5 wake-ups per request, `wake_ups` in `/config`, 0 for
no limit.

## Who does what

| Pi (content) | The harness (process) |
| --- | --- |
| Reads, writes code and documentation, hunts bugs, runs tests | Makes the task file and roadmap line, ticks the progress boxes from what Gate saw, marks the task and roadmap done, commits |
| Answers the person | Wakes Pi up when it loops, hangs or stops with work open; reports every incident |
| | Stops only when Pi genuinely cannot go on (crash, model gone, wake-ups used up), with **Ask Pi to Retry…** |

## 1. Reports (for the later analysis)

`<data>/reports.jsonl`: one line per incident, from every part of the harness: a rule sent something back (Gate), Gate
failed, a loop or hang recovery, a wake-up, an unverified end, a genuine stop. Each has the time, the request (job id
or terminal), the project, the kind and the detail. `/reports` in the console counts them by kind and lists the latest;
`docs/lessons/` is written from them.

## 2. Keep running

- **Gate failure** (G-011): the call is retried 3 times over about 10 seconds; if Gate still fails, that one call is
  blocked with the reason and Pi continues (it can try again). Reported. The turn no longer stops.
- **Loop or hang**: the recovery that asks again in another way runs up to `wake_ups` times (was once). Reported.
- **Stopped with work open**: when Pi ends a turn but changed code without a passing test on it (G-012), the harness
  sends it back: "Continue: the change is not verified yet; run the tests and finish the task". It does not wake Pi
  when its answer asks the person something. Counts toward `wake_ups`. Reported.
- **Genuine stop**: Pi's process exits, the model is unreachable, or `wake_ups` are used up: the request ends
  **Stopped** with the reason, and Activity offers **Ask Pi to Retry…** (A_Retry: the request quoted, an optional note,
  "Queues the request again in <project>. The failed run stays in its record.").

## 3. Paperwork

In a project with `ROADMAP.md` and `tasks/`, the extension tells Gate when a request starts and ends. Gate then:

- at the first write or edit outside the plan files, uses the task the request names ("do task 2") or creates
  `tasks/NNN-<words>.md` (next number, `Kind: code`, the request quoted, a "Progress (kept by the harness)" section) and
  adds its line to `ROADMAP.md`. Pi is told the task's path in its next tool result.
- as tests run, ticks the progress: "Red: `<command>` failed at 14:02", "Green: `<command>` passed at 14:10 on the final
  code".
- at the end, when the change is verified (G-005 would pass), ticks "Done", marks the roadmap line done and commits
  locally: `<the request's first words> (task NNN)`. A Markdown-only change becomes `Kind: docs` and needs no tests. Not
  verified: the task stays open, marked "Not verified".

Pi never needs to format a task or tick a progress box; G-008 to G-010 still stop it from damaging them.

## Order

Reports, then keep running, then Ask Pi to Retry…, then paperwork; one task and commit each.
