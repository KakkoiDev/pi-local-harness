# 320: Explain an already-running Workbench

Kind: code

Owner reported a port collision after a second launch and explicitly asked for a clear message that the harness is running elsewhere. The previous release left an agent-owned instance running; it has been closed by its exact owned session.

- [x] Red: installed launcher tests show a second Pi starts instead of explaining the running instance.
- [x] Stop a duplicate launch before Pi starts, regardless of update settings; show the existing URL and how to restart.
- [x] Replace startup port-collision tracebacks with a clear explanation without stopping any other application.
- [x] Run the workflow, commit, push and install; leave no extra agent-owned live instance.

## Evidence and handback

Both installed-launch checks failed before the change, including automatic updates off. The subprocess collision check reproduced the traceback before repair. All 11 launcher/update/startup checks pass after repair. The commit is chained to the complete workflow gate. Installation is performed after commit without starting another live instance.

## For the person

A second launch says the Workbench is already running elsewhere, shows its address and explains restarting. A required port owned by an unknown application gets a clear message rather than a traceback.
Tried it: installed launcher and service subprocess regressions, including automatic updates off.
