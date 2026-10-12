# Pi harness boot sequence

- [x] Load the global pi harness when plain pi starts.
- [x] Initialize Laya before accepting HTTP requests.
- [x] Start loopback Laya/API and frontend services and report actual ports after binding.
- [x] Start deterministic monitoring and load persistent memory.
- [x] Stop owned service processes on pi shutdown.
- [x] Verify startup in the real pi runtime and localhost service tests.

Whisper stays lazy-loaded and runs only for submitted audio paths. PostgreSQL,
analytics aggregation, and the supervisory web dashboard from the older lifecycle
proposal are future features tracked separately.
