# 337: Rename the product Pi WorkStation

Kind: code

Request 2026-10-20: see [the owner request and research](../docs/plans/337-pi-workstation-skills-and-knowledge.md).

- [x] Red: branding journey for browser/terminal name and Japanese copy, plus existing-data compatibility.
- [x] Update current product copy without changing storage paths, saved identities, repository URLs or the separately named design system.
- [x] Run workflow and browser suites, update the handback and publish a verified build.

## Scenarios

### US-351 the browser and terminal identify the app as Pi WorkStation without losing my projects
Given a registered scratch project in the existing data location
When I open About, reload and render terminal startup
Then the product is Pi WorkStation, Japanese copy uses the same name, and the project keeps its ID and path

## Status

Verified source release. Browser, terminal and Japanese product copy use Pi WorkStation; storage paths, author identities and the design-system name remain compatible. Restart plh after the source release to load the build.

Red evidence: US-351 failed on browser title Pi Workbench before the copy change. The first attempt did not run because Playwright was not in its usual cache; the replacement used the already installed bundled package and failed on the actual assertion.
