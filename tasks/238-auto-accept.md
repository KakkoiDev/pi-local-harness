# 238: Auto-accept: run the plan without supervision, check later

Kind: code

Read docs/plans/236-plan-mode.md, "Auto-accept". The person: "it's basically saying YOLO, do the thing and I check
later, in a few hours how it went." Also used by the bench.

## Steps
- [ ] The setting: one for all projects (decided 2026-10-16), in the web Settings and `harness/settings.py`
  (`auto_accept`, like `language`), remembered, no time or task limit.
- [x] Terminal: `/auto on|off|status` (harness/console.mjs CONSOLE_COMMANDS, harness/admin.py); the footer shows
  "Auto" while on (harness/footer.mjs); `/status` gains a "Run on its own" row; `/report` prints the last run's report;
  the end of a run prints a one-line summary.
- [ ] Names and places (the designer, round 10 v2): "Run on its own"; Settings, the checkbox beside Send and the Agent
  menu item (⌥⌘A) all set the same global setting; the status reads "Working · on its own". The risk alert: Turn On /
  Cancel, Cancel the default, every time, from every place.
- [x] The extension: with auto on, `ask_choices` returns option 0 (recorded `auto`), plans are approved (`Plan
  approved: auto`), check-ins continue to the next open task, until the roadmap has no open task.
- [x] Everything is automatic with auto on (decided 2026-10-16: "we go YOLO and inform the user about the risks
  first"), including publishing, git push, downloads, sending an issue or a message, Move to Trash, removing a project.
  Files still go to the Trash, never deleted for good.
- [ ] The risks first: turning auto on (web Settings, `/auto on`) lists what will happen without asking and needs a
  yes, every time.
- [ ] The report at the end of the run (and when the person comes back, if unseen): the AwayCard's four sections with
  counts: tasks done (each verified or not), every decision Pi made on its own (each with Change…), everything that
  left the Mac or used the Trash, problems met (tests failed then fixed, commands Gate blocked). The data comes from
  the request records, the test-run log (task 228) and Gate's log.
- [x] The bench: `python3 -m bench run` turns auto on for its projects (bench/runner.py).
- [ ] Red/green tests for each rule above.

## Done when
With auto on, a roadmap of several tasks runs to its end without a person, nothing irreversible happens, and the
person can read every automatic decision afterwards.

## Result

The live global `auto_accept` setting, authenticated web endpoints and terminal commands share one repeated risk confirmation. Cancel comes first; generic `/config set auto true` uses the same confirmation. Choices pick option 0, plans record auto approval, and verified check-ins start fresh request identities. An unverified task stops for review. The publication audit is the last approved task and cannot be ticked without its real checks.

Durable per-run reports keep task outcomes, automatic decisions, completed external/Trash commands and Gate/recovery problems, with counts and unseen state. `/report` shows readable sections and terminal completion shows counts. The bench enables the setting in scratch data and records plan tasks, Done when lines and questions alongside app success.

The web Settings control, composer/menu toggles, risk alert and AwayCard remain for task 239’s designed UI. The corresponding boxes stay open. Core and terminal tests are included; live model bench verification follows in task 235.
