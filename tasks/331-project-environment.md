# 331: A new project's packages are installed at Create, and an existing project can install them

Kind: code

Request 2026-10-19: “yes, let's download and make it available everywhere” (answering: where should a project's
packages be installed (`uv sync`)? Recommended: at Create in Project Start, with the download shown).

Live evidence: the “Habit Tracker” web project (Project Start, Database + Charts + Install) had no `.venv`: Project
Start's base check used the standard library's unittest only and the Preview never started, so pytest was never
installed and Pi's pytest tests could not run (`uv run pytest` is refused without `--offline`; `uv run --offline pytest`
fails without an environment).

Relates to [task 303](303-starters-work-first-time.md) (a new project works on the first command) and
[plan 253](../docs/plans/253-one-app-many-packages.md) (Project Start). System 1 decides everything here: the lock file
gives the numbers, pressing Create (or confirming Install Packages…) is the person's approval, code runs the install.

- [x] Red (unit): the package count and download size come from the lock file (tests/fixtures/packages/uv.lock: the
  packages this computer installs, markers and extras followed, the wheel for this platform; no sizes → “size shown
  after the first install”); package-lock.json for npm (tests/test_packages.py).
- [x] Red (unit): Create installs with `uv sync --frozen` (online, this one time) after assembling and before the base
  check, which then also runs `uv run --offline pytest -q`; a failed install still creates the project, with the note;
  downloads are off in tests (`PI_NO_DOWNLOADS`), never a real download (stubbed `uv` on PATH).
- [x] Red (unit): Gate's refusal alternative names Install Packages… when the environment is missing, and the first such
  refusal per project carries a harness notice (tests/test_guardrail_questions.py, tests/test_packages.py).
- [x] harness/packages.py: the facts (count, size, line), missing(), install() with its progress lines, the own-tests
  command; the npm flow (`npm ci`) for a package.json with dependencies and a package-lock.json.
- [x] Project Start: the Summary's “Install the app's packages” line with the real numbers and “Pressing Create
  approves the download”; Create shows the install's progress; the toast says when the packages were not installed.
- [x] Project › Install Packages… (person only, `/api/projects/packages`, PERSON_ROUTES): the same size line, a
  confirm, `uv sync --frozen`, a person decision in the decision log; disabled when nothing is missing.
- [x] The Preview of a project whose packages are missing does not start (no second install path) and points to
  Install Packages…; once installed it runs `uv run --offline`.
- [x] Terminal Pi: `/setup packages` (the person's terminal only; Pi's harness tool never runs it) asks first.
- [x] Docs: harness/GUIDE.md, the starter READMEs, task 303's notes, docs/user-stories.md; designer note in
  design/briefs/round-13.md; Japanese strings in messages/ja.json.
- [x] Green: python3 tests/verify_workflow.py; tests/browser/run.py all.

## Scenarios

### US-320 the Summary shows the packages to download and Create installs them before the base check
Given the New Project dialog with the Web app package chosen
When I reach the Summary and press Create
Then the Summary said “Install the app's packages: 32 packages, about …” and that pressing Create approves it
And Create ran `uv sync --frozen`, then the base check with `uv run --offline pytest -q`, and the project has its .venv

### US-321 Create while offline still creates the project and says its packages are not installed
Given the New Project dialog with the Web app package chosen and no connection
When I press Create
Then the project is created and its first commit is made
And the toast says the packages were not installed and names Project › Install Packages…

### US-322 a project without its packages offers Install Packages… and installs them after I confirm
Given a Web app project whose .venv is missing
When I choose Project › Install Packages… and press Install
Then the dialog showed the package count and size before I confirmed
And the project has its .venv and the decision log has my packages_install decision

### US-323 a refused test run points to Install Packages… in the chat
Given a Web app project whose .venv is missing, in Implementation
When Pi runs a pytest test run that Gate refuses
Then the chat shows a harness notice that the packages are not installed, with an Install Packages… button

### US-324 the install route refuses a request without the page's secret
Given a Web app project whose .venv is missing
When something other than my page asks the workbench to install its packages
Then the request is refused and nothing is installed

### US-325 terminal: /setup packages asks first and installs the project's packages
Given a Web app project whose .venv is missing, open in terminal Pi
When I type /setup packages and choose Install Packages
Then the packages are installed after my yes, and Pi's own harness tool only proposes the command
