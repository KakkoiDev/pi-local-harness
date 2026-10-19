# The kit (plan 198)

What Pi builds with, pinned and on this machine: the libraries (`vendor/`, listed with versions, licences and checksums
in `libraries.json`), one agent card each (`cards/`, or the library's own, such as p2p-core's AGENTS.md), and the
toolchain's pins (`toolchain.json`). Opinionated: one way for each need. Local: no CDN, no docs fetched while building.
Capable: Pi assembles from these instead of inventing. Third-party licences: `THIRD_PARTY_NOTICES.md`.

Project Start (round 12, plan 253): `capabilities.json` is the catalogue of capabilities (what an app does) and packages
(how it runs); `capabilities.py` assembles a base from a starter plus each capability's files (`capabilities/<id>/`,
vendored libraries with their licences) and runs the base check offline: the package's base tests and every
capability's own tests, with Python's unittest or Node's test runner alone. `python3 kit/capabilities.py <folder>
static,phone offline,charts` does what New Project does. A capability the kit cannot assemble yet is listed with its
reason and `available: false`.

E2E tests (task 329): the web and static starters ship one e2e example in `tests/e2e/`, one test per scenario named
after its title, driving Chromium through Playwright (recipe: `cards/e2e-scenarios.md`). The base check never runs it,
so Create never needs a browser; run by hand or by Pi with no Playwright or no browser set up, it is skipped and says
why. Nothing is downloaded.

## App Blocks (`blocks/`, plan 266 item 7)

The designer's ready-made app and game parts (`design/app-blocks`, 151 cards), as cards Pi gets one at a time:
`blocks/<group>/<Name>.md` (the card: facts, states, English and Japanese texts, keyboard and focus, phone, data, what
not to invent) beside its code (`<Name>.html`, `.css`, `.js`; a second block of one language is `<Name>.2.html`), so Pi
copies exact markup instead of re-typing it. `blocks/index.json` lists every card: name, group, kind (foundation,
block, archetype, genre, art), purpose, English and Japanese keywords, file paths, the libraries it needs, the
foundation it assumes (AppFoundations, or GameKit for games) and the blocks an archetype or genre uses. Paths are
stable; Project Start and the capability catalogue refer to them.

- `blocks/build.py` rebuilds all of it from the designer's READMEs (run it after a re-sync; a test fails until you do).
  `blocks/keywords.json` is the only hand-written input: the words that route a request to a card.
- `blocks/add.py <project> <Name>…` copies what the cards need (Basecoat's script, Chart.js and Basecoat's chart
  wrapper, with licences) and adds their texts to the project's `messages/*.json`.
- `blocks/check.py <file>…` checks a generated page: classes Basecoat 1.0.2 does not have, missing labels, charts
  without a table, hard-coded colours, CDN links.
- Routing (`harness/blocks.mjs`): the request's words pick the cards; Pi loads one more with the `app_block` tool.
