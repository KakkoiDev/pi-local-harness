# 375: The Preview runs the app inside the test sandbox's file boundary

Kind: code
No scenarios: the person sees the same Preview; an app that tries to write outside its project or read secret files now fails there, as its tests already did.

Request 2026-11-04: "do recommended actions" of docs/reports/outside-tools-study-2026-10-30.md, rank 4: Preview file
sandbox (OS-1 step b), which fixes F1's file half. The network is unchanged (the internet), as the study's step b says;
following the project's own widening is step c, rank 9, not this task.

- [x] Red (unit, macOS): an app started by the Preview cannot write outside its project, cannot write in its `.git`,
  and cannot read a fake `~/.ssh` file; it still writes in its project and TMPDIR, and still gets APP_LANG.
- [x] Start the Preview's command with `gate.sandbox.argv(command, folder, data, 'internet')`; APP_LANG joins the
  runner's allow-list so the app keeps its language.
- [x] Green: `python3 tests/verify_workflow.py`, `tests/test_preview.py`, `tests/test_sandbox.py`.
- [x] Found on the way: a project inside the data folder could not resolve its own path in the sandbox
  (`Path.cwd().resolve()` reads the folders above it, and the data folder was hidden whole), so the Preview's file
  server answered 404 for every page. The profile now allows only the metadata of those folders; their files and
  listing stay hidden. Test runs had the same defect.

## Verification

Red first: the fixture app wrote outside its project and in `.git` and read a fake `~/.ssh` file; the path probe in
`tests/test_sandbox.py` failed with "Operation not permitted" on the data folder. Both pass now and fail again with
each change reverted. `tests/test_preview.py` and `tests/test_sandbox.py` pass under Python 3.13. Smoke on this Mac: a
copy of `kit/starter` (styles set aside) started with `uvicorn --reload` in a data-folder project, answered 200, and
answered 200 again after an edit reloaded it. Not verified: the Tailwind build path, because the Tailwind download
fails on this network with a certificate error with or without the sandbox; the terminal Preview.
