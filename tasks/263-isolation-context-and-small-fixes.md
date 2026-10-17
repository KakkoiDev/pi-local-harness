# 263: Tests never touch the live data; secrets stay out of context; Gate never crashes on refusals

Kind: code

Request 2026-10-18 (from Claude's review, docs/reviews/2026-10-18-claude-review.md items 13, 14, 15 and the P2/P3
lines on test isolation, refusal wording, box bullets, propose_plan, screenshots and updates): "No test may write to
the real data folder", "Context selection: honour .gitignore, deny dotenv files, keys, licences, build and cache
folders, record what was left out", "Gate never crashes on refusals", and the small fixes listed below.

## 1. Tests never write to the live data folder (review 15, P2 isolation)

- [x] Red (unit): the Node suite run with HOME set to a temporary folder leaves that folder empty
      (tests/test_test_isolation.py); the lock and turn tests in tests/harness/extension.test.mjs wrote report rows there.
- [x] harness/extension.mjs takes the data folder from harness/data-folder.mjs, which refuses
      the default `~/pi-local-harness-data` while running under `node --test` (NODE_TEST_CONTEXT): a test that forgets
      PI_AGENT_DATA fails loudly instead of writing there.
- [x] tests/harness/extension.test.mjs sets PI_AGENT_DATA and PI_WEB_DATA to a temporary folder for the whole file.
- [x] tests/isolation.py also pops PI_WEB_PORT, PI_GATE_PORT, PI_CODING_AGENT_DIR and points PI_AGENT_DATA at a
      temporary folder, so a Python test that forgets it cannot reach the live folder either.
- [x] Green: node --test tests/harness/*.test.mjs; python3 tests/verify_workflow.py.

To see the rows the tests already left in the data folder (read-only; nothing is changed or deleted):

```sh
python3 - <<'EOF'
import json, os, re
data = os.path.expanduser('~/pi-local-harness-data')
temp = re.compile(r'^(/private)?/(var/folders/[^/]+/[^/]+/T|tmp)/')
times = set()
for line in open(os.path.join(data, 'reports.jsonl'), encoding='utf-8'):
    row = json.loads(line)
    if temp.match(row.get('cwd') or ''):
        times.add(row['time']); print('reports.jsonl  ', line.rstrip()[:200])
for line in open(os.path.join(data, 'decisions.jsonl'), encoding='utf-8'):
    if json.loads(line).get('time') in times: print('decisions.jsonl', line.rstrip()[:200])
EOF
```

Report rows from a test have a `cwd` in a temporary folder (`/var/folders/…/T/pi-lock-…`, `pi-turn-…`); decision rows
from the same test share their timestamp to the millisecond. To clean them, the person can copy the files first and
remove those lines by hand; the harness does not do it.

## 2. A refused shell command is a G-015 refusal, not a Gate crash (review 14)

- [x] Red (unit, unmocked): with an active request, an unknown command in Discussion is refused G-015 with a
      judgement (tests/test_laya.py); it was G-011 because `json.dumps` met a PosixPath.
- [x] gate/ledger.py passes `str(root)` to `judgements.decide`; tests/test_laya.py no longer asserts the Path.
- [x] Green: python3 -m unittest tests.test_laya.

## 3. Secrets and build output stay out of Pi's context (review 13)

- [x] Red (unit): a project with `.env` holding a fake key, `secrets/id_rsa`, `server.pem`, `COPYING`, `NOTICE`,
      `target/`, `venv/`, `.tox/`, `.mypy_cache/`, `third_party/` and a `.gitignore`d file: none of their contents or
      names reach the context text; each is in the record's `excluded` list with its reason.
- [x] harness/context.py: one deny list (dotenv, keys, licences and notices, build/cache/venv folders) plus
      `git check-ignore`; excluded files are recorded with their reason (context record, turn report).
- [x] Green: python3 -m unittest tests.test_context.

## 4. No test hides after unittest.main(); skipped music renders say "Not run" (P2)

- [x] Red (unit): a lint test fails when a test file has code after its `if __name__ == '__main__'` block
      (six files did: test_admin, test_gate_rules, test_model_choice, test_paperwork, test_remote_access, test_setup).
- [x] Move each `__main__` block to the end of its file.
- [x] The two music render tests skip with "Not run: …" and how to set them up, and fail when CI is set.
- [x] Green: python3 -m unittest discover -s tests; node --test tests/harness/music.test.mjs.

## 5. Small fixes (P2/P3)

- [x] Red (unit): a refused command says "Not run", a refused plan proposal "Not proposed", not "Not written".
- [x] Red (unit): writing in a folder that is not a project says so (register it or add ROADMAP.md), not ⇧⌘2.
- [x] Red (unit): G-010 and box counting treat `-`, `*` and `+` bullets the same (ticking Red under a star bullet is
      refused like under a dash; an open box under a plus bullet counts as open).
- [x] Red (unit): propose_plan keeps the roadmap's task lines when ROADMAP.md has no heading after `## Goal`.
- [x] Red (unit): the browser suites write screenshots under a per-run temporary folder, never a fixed /tmp path.
- [x] Red (unit): the Update window shows the backend's `why` for "unknown".
- [x] Red (unit): `/update now` with auto_update false says plh will not install it on start, and how to.
- [ ] Red (unit): plh does not auto-update while a workbench answers on its port; it says why and starts the
      installed build.
- [ ] Fix each; Japanese copy for the new refusal sentences in messages/ja.json.
- [ ] Green: python3 tests/verify_workflow.py; node --test tests/harness/*.test.mjs; browser suites.

## Needs design

- The Implementation shortcut ⇧⌘3 is macOS's screenshot shortcut. The design boards (PhaseControl card,
  R11_PhaseMenu, R11_Refusals) draw ⇧⌘1 · ⇧⌘2 · ⇧⌘3, so it is not changed here; the designer should choose another.
- The new refusal copy ("Not run: …", "Not proposed: …", "not a project") is not on R11_Refusals yet.
