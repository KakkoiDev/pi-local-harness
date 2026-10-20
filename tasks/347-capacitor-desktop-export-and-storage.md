# 347: Capacitor Electron desktop exports and native storage

Kind: code

Owner decision 2026-10-20: [plan253](../docs/plans/253-one-app-many-packages.md), “Owner decision: Capacitor mobile and Electron desktop”. Depends on the shared source/browser artifact and compatibility work in tasks275–278. Coordinates with mobile task279 and conformance task281.

- [ ] Inspect and pin the Capawesome Electron platform and required plugins; record maintenance, licences, capabilities and build-host requirements. Obtain download approvals before fetching dependencies.
- [ ] Obtain export/desktop-storage designs before implementing controls; use the round16 designer brief addendum.
- [ ] Red: packaging, bridge, native SQLite/filesystem contract and platform journey tests fail before implementation.
- [ ] Package the same Python/HTMX/Pyodide app for Windows, macOS and Linux through the Capacitor Electron integration, without a second business-logic implementation.
- [ ] Implement app-private persistent storage and native Open/Save/folder access through an isolated, validated bridge; retain the same storage contract as browser/server adapters.
- [ ] Handle denied permissions, path traversal/symlinks, hostile renderer IPC, full disk and interrupted writes; preserve valid data, recoverable Trash, backup/restore and upgrade persistence. No secrets in bundles or Git.
- [ ] Show unsupported capabilities, SDKs, signing/notarization and distribution requirements honestly; no implicit download or publish.
- [ ] Green: unit/contract tests and real packaged journeys on all three desktop OSes; per-target logs and not-run reasons; task281's shared-rule-change proof and workflow checks pass.

## Scenarios

### US-new the desktop export preserves local data after restart
Given the shared acceptance app packaged through Capacitor Electron for this desktop OS
When I create a note, close and reopen the installed app offline
Then the note and its priority remain available from native local storage

### US-new native file access keeps cancellation and denied permissions recoverable
Given the desktop app offers an export through a native Save dialog
When I cancel or the selected location denies writes
Then no partial document replaces an existing file and I can retry successfully

### US-new hostile page content cannot use the desktop storage bridge outside its scope
Given a packaged desktop app displaying model-produced markup
When that content attempts arbitrary IPC or access outside the authorized storage scope
Then the operation is refused and the app's existing files remain usable

### US-new one shared rule change reaches every desktop export
Given the acceptance app packaged for Windows, macOS and Linux
When its priority rule changes once in the shared Python source and all targets are rebuilt
Then the same behavior tests pass on each real OS without platform-specific business-rule copies

## Needs design

Export target selection, prerequisite/download summaries, native file/folder access, progress, errors/retry, signing/distribution guidance and unavailable-target states. No new production controls before named local designs.
