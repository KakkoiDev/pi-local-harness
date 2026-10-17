# 291: Generated media can be written outside an approved task (option A)

Kind: code

The person, 2026-10-18 ("option A, yes"): music, and later visual assets, may be written in Discussion and Planning, but
only into `assets/music/<name>/` or `assets/visual/<name>/`, as new numbered revisions, never overwriting.

- [x] Gate allows the music tool's create/revise/render (and the future visual tool's) in every phase only for a new
  revision folder under its kind's assets path inside the project; anything else follows the phase rules.
- [x] The revision written is the one checked (not only `0001/`); a stale base, traversal, symlink or absolute path
  outside the project is refused.
- [x] The music guides (harness/guides/music.md, harness/music/AGENT_GUIDE.md, docs/music.md, README) say so.
- [x] Tests: create and revise in Discussion succeed; overwriting or writing elsewhere is refused.

Done: `gate/media.py` (the kinds table: music → `assets/music`, visual → `assets/visual`) decides a media tool's
revision writes in every phase, called first from `gate/phases.py`'s `refusal`; the old Implementation-only music branch
is gone. `harness/music.mjs` also refuses publishing onto an existing revision folder. Tests: `tests/test_media_writes.py`,
`tests/test_phases.py`, `tests/harness/music.test.mjs`.
