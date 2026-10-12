# 44: Navigation regression and update recovery

The live server returned 404 for `/js/ui.mjs` after installation, aborting the
frontend module import and leaving all four tabs without handlers. Running
Python retains its old route allowlist until the PLH session restarts.

- [x] Reproduce the failure against the running workbench.
- [x] Show actionable startup recovery when browser modules cannot load.
- [x] Assert panel visibility, selected tab, composer visibility, and mobile widths.
- [x] Verify source and installed runtime, update documentation, and commit.

Browser fixtures simulate the exact missing-module failure. Installed-runtime
coverage uses `PI_TEST_RUNTIME` with isolated ports/data and a fake Pi worker.
The existing user session must restart to load the updated backend routes.

Verified: 60 Python tests, 21 Node tests, and full Chromium browser flows against
both the checkout and installed package. All four tabs select only their panel
at 320, 390, 768, and 1440 pixels. Missing module imports show restart guidance.
