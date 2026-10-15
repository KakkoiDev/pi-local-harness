# 238: Auto-accept: run the plan without supervision, check later

Kind: code

Read docs/plans/236-plan-mode.md, "Auto-accept". The person: "it's basically saying YOLO, do the thing and I check
later, in a few hours how it went." Also used by the bench.

## Steps
- [ ] The setting: one for all projects (decided 2026-10-16), in the web Settings and `harness/settings.py`
  (`auto_accept`, like `language`), remembered, no time or task limit.
- [ ] Terminal: `/auto on|off|status` (harness/console.mjs CONSOLE_COMMANDS, harness/admin.py); the footer shows
  "Auto" while on (harness/footer.mjs).
- [ ] The extension: with auto on, `ask_choices` returns option 0 (recorded `auto`), plans are approved (`Plan
  approved: auto`), check-ins continue to the next open task, until the roadmap has no open task.
- [ ] Everything is automatic with auto on (decided 2026-10-16: "we go YOLO and inform the user about the risks
  first"), including publishing, git push, downloads, sending an issue or a message, Move to Trash, removing a project.
  Files still go to the Trash, never deleted for good.
- [ ] The risks first: turning auto on (web Settings, `/auto on`) lists what will happen without asking and needs a
  yes, every time.
- [ ] The report at the end of the run (and when the person comes back): tasks done (verified or not), every automatic
  decision (each changeable), every action that left the machine or moved something to the Trash, problems met.
- [ ] The bench: `python3 -m bench run` turns auto on for its projects (bench/runner.py).
- [ ] Red/green tests for each rule above.

## Done when
With auto on, a roadmap of several tasks runs to its end without a person, nothing irreversible happens, and the
person can read every automatic decision afterwards.
