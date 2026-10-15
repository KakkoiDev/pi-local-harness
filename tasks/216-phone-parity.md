# 216: The phone does everything the desktop does (round 8 brief)

Kind: planning

Request 2026-10-15: "the phone UI/UX is not on par with the desktop UI/UX. There are actions that are impossible to
perform on mobile. let's get a new artifact to the designer AI to fix all those issues."

- [x] Audit: every desktop action (menus, shortcuts, window controls, dialogs) against its phone path, in the code and
  running at 390 × 844 with touch on a scratch workbench, by a helper agent. Seven impossible (model and thinking;
  rename, move, trash a file or folder; Review; Ask Pi about a selection; Markdown source; Preview Stop / Start; Reload
  from Disk), a dozen awkward, what the boards draw that the code lacks, twelve questions.
- [x] Brief: `design/briefs/phone-parity.md`, published with the screenshots for the designer.
- [x] Fixed at once, being plain bugs: on a fresh phone "Comments N" opened only the scrim (the desk's Review state hid
  the sheet); `PI_BINARY` was ignored by the web worker, so a scratch workbench started the real Pi (found by the audit,
  task commit 3c589fc); the Preview view's window title was blank.
- [ ] Build round 8 from the designer's answer.
