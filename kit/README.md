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
