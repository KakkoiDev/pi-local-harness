# 235: Bench scenario: a pong game from the starter

Kind: code

The person, 2026-10-16: "ok let's add it to the benchmark." The pong request (2026-10-15) found three harness problems
at once (the early commit, the leftover sample, the empty plan).

## Where
- bench/scenarios/<id>/scenario.json, project/, check/, solution/ (copy the layout of bench/scenarios/feature-slugify;
  read bench/__init__.py and bench/runner.py first for how a scenario is set up, sent, answered and checked).
- id: `feature-pong-starter`, kind feature, prompt levels: everyday (the person's words, typos kept: "I want to make a
  very basic and minimal pong game. white pales and white ball and black background. arrows control the right pale
  and w/s the left one."), precise (the same, spelled out, with sizes and speed).

## Setup
The project is made by `kit/new_project.py --static` at run time (not a copy), so the scenario follows the starter.

## Scripted answers (plan mode, task 236)
The bench runs with auto-accept (task 238); it also answers known questions when asked: ball speed "medium", winning
score "11", serve "towards the player who lost the point".

## Checks (check/, run by the bench, never by Pi)
- [x] The game, in the headless shell (`plh setup browser`, harness/browser.mjs): the page has one canvas; the
  background pixels are black; after 30 frames the ball's white pixels moved; holding W moves the left paddle up and
  ArrowUp moves the right one (compare white pixel rows before and after).
- [x] The sample is gone: no js/logic/notes.mjs, no "Notes" in manifest.webmanifest, no `notes.` keys in messages,
  no notes text in README.md.
- [x] Every referenced file exists (task 230's test passes).
- [x] The plan: ROADMAP.md's Goal filled, no placeholder task, every task has Done when (task 233's checks).
- [x] The task is verified and committed by the harness (the result's `verified`, and git log).
- [x] The project's own tests pass.

## Steps
- [x] Write the scenario; `python3 -m bench check feature-pong-starter` passes on solution/ and fails on the starter
  as made (red, green for the checker itself).
- [x] Run it once with the harness and once bare on the model in config, and record the result in this file.

## Done when
`python3 -m bench run feature-pong-starter` grades all six checks, and the comparison table shows it.

## Result

The scenario creates the current static starter through `kit.new_project.new_project`, with the same initial planning task as a new web-workbench project. The hidden checker observes connected white canvas-pixel regions, waits 30 animation frames, and holds each control while comparing paddle rows. It also runs the original referenced-files test independently of the project's copy. The reference solution moves sample files to a scratch Trash.

Request verification remains a separate runner grade: only Pi Workbench commits after the baseline HEAD count, so the starter's own initial commit cannot claim success. The hidden checker never sees or manufactures a verified request commit.

Red: the runtime-starter regression failed with a missing project source before runtime setup was implemented. Green: that test and 27 benchmark/document tests passed. `python3 -m bench check feature-pong-starter` fails on the untouched starter and passes with the reference solution, using the installed Chromium headless shell.


### Live comparison · 2026-10-16

Everyday prompt, `gemma4:26b-mlx`, high thinking, Pi 1.1.0, Ollama 0.40.5, model digest `f0fc7e0ae494`, task 241 core build `bcbce0a`. Both runs used scratch workbenches and automatic acceptance. The build is reported dirty because worktree changes were present; this is a development comparison, before task 239 was committed, not the final task 244 measurement.

| Mode | Solved | Verified / committed | Minutes | Tool calls | Wake-ups | Refusals |
|---|---|---|---|---|---|---|
| Harness | No | No | 9.2 | 0 | 1 | 0 |
| Bare | No | No | 6.7 | 1 | 0 | 0 |

The harness woke the model once after it stopped without acting. Its final response still asked for approval and described a plan in prose; it did not call the planning tool or build the game. Bare Pi also stopped at a prose plan asking for approval. Neither produced a request commit. The app checks failed; the bare check's short diagnostic ended in a browser-server broken-pipe message, so that diagnostic alone does not identify a game defect. The lack of implementation and request verification is independently recorded.

The path-free machine summary is in `docs/bench/2026-10-16-pong/results.jsonl`. Full scratch outputs stay ignored in `.bench-local/`; project copies and service logs are not committed. Task 244 will measure the final build across all requested models and scenarios.
