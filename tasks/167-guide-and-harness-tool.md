# 167: A guide for new users, and the console as a tool for Pi

Kind: code

Request 2026-10-14: "let's include a readme or tutorial so that the pi harness can answer questions about how to use this tool, open the front end, share to other devices, choose a model, like a FAQ corner to guide new users." The person also pasted a terminal session: asked "how can I use this app?", Pi ran `python3 -m harness.admin` from the home folder (module not found), then searched the disk with `find /` for 1 min 44 s.

- [x] `harness/GUIDE.md`: 20 questions and answers (what it is, start, open the workbench, projects, rename/move/trash, Chat or Work, comments, what Pi sees, Activity and Gate, long tasks, models, pulling and removing, phone and other devices, voice, settings, the console, trouble, where data lives).
- [x] Red (python): `/guide [words]` prints the guide, or the questions about the words (a question's own words win over a passing mention), or says nothing matches and lists the questions; every console command is in the guide.
- [x] Red (node): Pi gets a `harness` tool (command from the console list, args) that runs the console from the harness's own folder; a change is not applied: it returns the preview and asks Pi to have the person type the command (plan 158 C1). Gate knows it as a read (it would have blocked it as an unknown tool).
- [x] CONSOLE.md tells Pi to use the tool instead of bash or searching, and `guide` for how-to questions. readme points at the guide.
- [x] Smoke test in real Pi (RPC, scratch data): `/guide phone` answers with the phone section; the extension loads with the tool registered. Not run: a real model calling the tool (ask terminal Pi "how do I open the workbench on my phone?" after restarting plh).
- [x] Green: verify_workflow.
