# 224: A README a person enjoys reading, with the workbench at the top

Kind: docs

The person, 2026-10-15: "I want the readme in the repo to be more human readable with a nice screenshot of what the app
looks like in action at the top of the README.md file".

- [x] `README.md` (was `readme.md`): what it is in two short paragraphs under a screenshot, what you can do, get
  started in four commands, updating, links onward. The technical detail moved unchanged to `docs/reference.md`;
  links to it updated (AGENT.md, docs/README.md, harness/README.md, the contributing checklist, install.py's copy).
- [x] `docs/screenshots/make.cjs` makes the screenshots from a scratch workbench (sample "Class Notes" app, a stand-in
  Pi with two answers, the Preview running), never from the person's projects: `workbench.png` (1440 × 900 at 2×) and
  `workbench-phone.png` (390 × 844).
- Found while taking them: with Work, Preview and Review open at 1440 px, the Review window runs past the right edge;
  on the phone, the chat does not scroll to the very last line of a reply. Not fixed here.
