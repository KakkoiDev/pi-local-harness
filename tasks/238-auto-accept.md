# 238: Auto-accept: run the plan without supervision, check later

Kind: code

Read docs/plans/236-plan-mode.md, "Auto-accept". The person: "it's basically saying YOLO, do the thing and I check
later, in a few hours how it went." Also used by the bench.

## Steps
- [ ] The setting: per project, remembered in the project's data (harness/documents.py project record or the
  web data folder; see Open questions in the plan: confirm per project vs global with the person before building).
- [ ] Terminal: `/auto on|off|status` (harness/console.mjs CONSOLE_COMMANDS, harness/admin.py); the footer shows
  "Auto" while on (harness/footer.mjs).
- [ ] The extension: with auto on, `ask_choices` returns option 0 (recorded `auto`), plans are approved (`Plan
  approved: auto`), check-ins continue to the next open task, until the roadmap has no open task.
- [ ] Never automatic, even with auto on: publishing, git push, downloads, sending an issue or a message, Move to
  Trash, removing a project. Gate already knows these actions (grep the rules and the propose-only paths); they go to a
  "Needs you" list instead of running.
- [ ] "While you were away": when the person returns (the next message, or opening the web after auto ran), a summary:
  tasks done (verified or not), decisions taken automatically (each changeable), what waits in "Needs you".
- [ ] The bench: `python3 -m bench run` turns auto on for its projects (bench/runner.py).
- [ ] Red/green tests for each rule above.

## Done when
With auto on, a roadmap of several tasks runs to its end without a person, nothing irreversible happens, and the
person can read every automatic decision afterwards.
