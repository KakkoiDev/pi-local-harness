"""Gate's rules: one registry, always enforced (plan 179).

Every check Gate (or the harness around it) makes is a rule here, with its id, when it applies, its scope, what happens,
one line for the system prompt, the lesson that motivated it (docs/lessons/) and the test that proves it. The model
cannot turn a rule off; rules change through a task with a test, like any code. AGENT.md does not restate them: the
prompt gets `summary()`, and `/gate rules` lists them.
"""
from dataclasses import dataclass
from pathlib import Path
import re

WHEN = ('before', 'after', 'commit', 'harness', 'end')  # before a tool runs, after it ran, before git commit, by the harness, at the end of a request
EVERYWHERE, PROJECT = 'every folder', 'a project with ROADMAP.md and tasks/'


@dataclass(frozen=True)
class Rule:
    id: str
    name: str
    when: str
    scope: str
    outcome: str      # BLOCK (nothing runs), REVISE (Pi is asked to change it), FLAG (the result is marked failed), STOP (the turn stops), MARK (the answer is marked)
    summary: str      # one line for the prompt and /gate rules
    test: str         # the test file that proves it (it names the rule id)
    lesson: str = ''  # docs/lessons/ file, when a seen mistake motivated it
    core: bool = False  # safety, kept in bare mode (the bench baseline); the rest is the harness around Pi


RULES = [
    Rule('G-001', 'Known tools only', 'before', EVERYWHERE, 'BLOCK', 'Gate checks read, write and shell tools; any other tool is refused.', 'tests/test_gate_rules.py', core=True),
    Rule('G-002', 'Permission level', 'before', EVERYWHERE, 'BLOCK', 'A profile may only use the risk levels it is allowed (standard: reads and reversible writes).', 'tests/test_gate_rules.py', core=True),
    Rule('G-003', 'No catastrophic shell commands', 'before', EVERYWHERE, 'BLOCK', 'Recursive deletes of roots, home or parent folders, disk erasure, raw device writes, broad recursive chmod/chown and broad find -delete are refused.', 'tests/test_gate_rules.py', core=True),
    Rule('G-004', 'Edits match exactly once', 'before', EVERYWHERE, 'REVISE', 'Each edit\'s old text must appear exactly once in the file, without overlaps; copy it from the file as it is now.', 'tests/test_gate_rules.py', 'L-003-edit-mismatch-script-rewrite.md', core=True),
    Rule('G-005', 'Commit order', 'commit', PROJECT, 'REVISE', 'git commit needs, since the last commit: a failing test run, the change, a passing run on that code, a ticked box in the task and in ROADMAP.md (Markdown-only commits skip the tests).', 'tests/test_gate_rules.py', core=True),
    Rule('G-006', 'Runs as approved', 'after', EVERYWHERE, 'FLAG', 'The tool that ran must be the one Gate approved, with the same arguments.', 'tests/test_gate_rules.py', core=True),
    Rule('G-007', 'Written file matches', 'after', EVERYWHERE, 'FLAG', 'After a write or edit, the file on disk must be exactly what Gate approved.', 'tests/test_gate_rules.py', core=True),
    Rule('G-008', 'Plan files change through edit or write', 'before', EVERYWHERE, 'REVISE', 'ROADMAP.md and tasks/*.md are changed with edit or write (System 1 owns task layouts and ticks), never by a shell command (redirects, sed -i, tee, scripts), so Gate checks the change.', 'tests/test_gate_rules.py', 'L-003-edit-mismatch-script-rewrite.md'),
    Rule('G-009', 'Plan files keep their content', 'before', PROJECT, 'REVISE', 'A write over an existing ROADMAP.md or task file may not drop ticked boxes or more than 5 lines; change it with edit.', 'tests/test_gate_rules.py', 'L-004-overwrote-whole-file.md'),
    Rule('G-010', 'Red and Green are ticked after the runs', 'before', PROJECT, 'REVISE', 'System 1 lays out and ticks task boxes from recorded evidence. Pi supplies content, never task checkboxes.', 'tests/test_gate_rules.py', 'L-006-unreproduced-fix.md'),
    Rule('G-011', 'A Gate failure blocks only that call', 'harness', EVERYWHERE, 'BLOCK', 'If Gate cannot check a tool call (an error, not a decision) after retries, that call does not run and is reported; the run continues. Never work around Gate with another tool.', 'tests/harness/extension.test.mjs', 'L-002-routed-around-gate.md'),
    Rule('G-012', 'Unverified changes are marked', 'end', PROJECT, 'MARK', 'A request that changed code and ran no passing test after the last change ends marked "Not verified", whatever the answer says.', 'tests/test_gate_rules.py', 'L-005-claimed-verified.md'),
    Rule('G-013', 'The harness commits', 'before', PROJECT, 'REVISE', 'Within a request, Pi does not run git commit: the harness makes the task, ticks its progress and commits locally: a verified change marked done, an unverified one marked "not verified" with its task left open.', 'tests/test_paperwork.py'),
    Rule('G-014', 'Plans are complete', 'end', PROJECT, 'MARK', 'A code request needs a real Goal, no starter placeholder task, and a checkbox and Done when: line in every linked task. Ask once to fill the gaps; otherwise mark Plan incomplete.', 'tests/test_gate_rules.py', 'L-007-empty-pong-plan.md'),
    Rule('G-015', 'Project phase permissions', 'before', PROJECT, 'REVISE', 'Discussion reads; Planning writes ROADMAP.md and tasks/; Implementation writes approved task files. Only you or auto changes phase.', 'tests/test_phases.py', 'L-008-guessed-project-decisions.md'),
    Rule('G-016', 'Ask instead of assuming', 'before', PROJECT, 'REVISE', 'An assumption in Pi’s text or reasoning since the last user answer must become an ask_choices question before writing content.', 'tests/test_gate_rules.py', 'L-008-guessed-project-decisions.md'),
    Rule('G-017', 'Decisions are settled', 'before', PROJECT, 'REVISE', 'Every Decisions line in the active task must be chosen, auto or given before code changes.', 'tests/test_gate_rules.py', 'L-008-guessed-project-decisions.md'),
]
BY_ID = {rule.id: rule for rule in RULES}


def bare():
    """PI_HARNESS_BARE=1: the bench baseline, plain Pi with Gate's core safety rules only."""
    import os
    return os.environ.get('PI_HARNESS_BARE') == '1'


def summary():
    """The rules as the system prompt gets them: one line each."""
    lines = ['Gate enforces these rules on every tool call (they cannot be turned off; /gate rules explains each).',
             'When a rule sends an action back, do what its message says; never work around it with another tool.']
    return '\n'.join(lines + [f'- {rule.id} {rule.name}: {rule.summary}' for rule in RULES])


SUMMARY_FILE = Path(__file__).resolve().parent.parent / 'harness' / 'gate-rules.md'


def write_summary():
    """harness/gate-rules.md: what the extension puts in every system prompt (tests/test_gate_rules.py keeps it current)."""
    SUMMARY_FILE.write_text('<!-- Generated from gate/rules.py by `python3 -m gate.rules`; do not edit. -->\n' + summary() + '\n', encoding='utf-8')


def decided(rule_id, reason):
    """The reason Pi reads: the rule id first, so it can look the rule up."""
    return f'{rule_id} {BY_ID[rule_id].name}: {reason}'


# -- the checks of the new rules ---------------------------------------------------------------------------------------
PLAN = r"(?:ROADMAP\.md|tasks/[^\s'\"|;&]*\.md)"
# Task 263: a box is a `-`, `*` or `+` list bullet with [ ], [x] or [~]; every check treats the three the same.
BULLET = r'[-*+]'
CHECKED = re.compile(r'(?<![^\s+])[-*+] \[[xX]\]')


def plan_file(path):
    """ROADMAP.md, or a Markdown file directly in tasks/."""
    path = Path(path)
    return path.name == 'ROADMAP.md' or (path.parent.name == 'tasks' and path.suffix == '.md')


def shell_writes_plan(command):
    """G-008: does this shell command write ROADMAP.md or a task file?"""
    if re.search(rf">>?\s*['\"]?[^\s'\"|;&]*{PLAN}", command): return True
    if re.search(rf"\btee\b[^|;&\n]*{PLAN}", command): return True
    if re.search(rf"\b(?:sed|perl)\b[^|;&\n]*\s-[a-zA-Z]*i\b[^|;&\n]*{PLAN}", command): return True
    return bool(re.search(PLAN, command) and re.search(r"write_text|writeFileSync|appendFileSync|open\([^)]*['\"][wa]\+?['\"]|\.write\(", command))


def plan_shrinks(original, content):
    """G-009: the reason a write over a plan file loses content, or None."""
    lost_ticks = len(CHECKED.findall(original)) - len(CHECKED.findall(content))
    if lost_ticks > 0: return f'it would remove {lost_ticks} ticked box{"es" if lost_ticks > 1 else ""}. Use edit to change only what you mean to change.'
    lost_lines = len(original.splitlines()) - len(content.splitlines())
    if lost_lines > 5: return f'it would remove {lost_lines} lines. Use edit to change only what you mean to change.'
    return None


def newly_ticked(original, content):
    """G-010: the text after '- [x]' of each box ticked by this change."""
    before = {line.strip() for line in original.splitlines()}
    ticked = []
    for line in content.splitlines():
        match = re.match(r'\s*[-*+] \[[xX]\]\s*(.*)', line)
        if match and line.strip() not in before and re.sub(r'\[[xX]\]', '[ ]', line.strip(), count=1) in before:
            ticked.append(match.group(1))
    return ticked


def plan_gaps(root):
    """G-014: concrete omissions in a project's Goal and linked tasks; never read outside its folder."""
    root = Path(root).resolve()
    roadmap = (root/'ROADMAP.md').read_text(encoding='utf-8',errors='replace')
    gaps = []
    goal = re.search(r'^## Goal[^\n]*\n(.*?)(?=^## |\Z)',roadmap,re.M|re.S)
    if not goal or not goal[1].strip() or re.search(r'^\s*Describe what we are building\.\s*$',goal[1],re.M):
        gaps.append('ROADMAP.md: write the Goal in one or two sentences.')
    if 'Define the first task' in roadmap: gaps.append('ROADMAP.md: replace the placeholder Define the first task with the real tasks.')
    first = root/'tasks/001-first-task.md'
    if first.is_file() and not first.is_symlink():
        text = re.sub(r'^Kind:\s*\S+\s*$', '', first.read_text(encoding='utf-8',errors='replace').split('## Progress (kept by the harness)')[0], flags=re.M)
        if text.split() == '# First task - [ ] Define the outcome - [ ] Implement - [ ] Verify'.split():
            gaps.append('tasks/001-first-task.md: replace the unchanged starter task with the real first task.')
    for name in dict.fromkeys(re.findall(r'\]\((tasks/[^)#]+\.md)(?:#[^)]*)?\)',roadmap)):
        path = root/name
        if not path.resolve().is_relative_to(root) or path.is_symlink() or not path.is_file():
            gaps.append(name+': link an existing task inside this project.');continue
        text = path.read_text(encoding='utf-8',errors='replace')
        if not re.search(r'^\s*[-*]\s+\[[ xX~]\]',text,re.M): gaps.append(name+': add at least one checkbox.')
        if not re.search(r'^Done when:\s*\S',text,re.M): gaps.append(name+': add a Done when: line.')
    return gaps


if __name__ == '__main__':
    write_summary()
    print(f'Wrote {SUMMARY_FILE}')


# One list for visible text and reasoning; the person's next answer clears the evidence in the extension.
ASSUMPTIONS=re.compile(r"I[’']ll assume|I assume|let[’']s say|probably|I guess|for now I[’']ll|default to|arbitrarily|not specified|unclear|I[’']m not sure|仮に|とりあえず|たぶん|不明",re.I)


def planning_refusal(task,assistant_text,required=False):
    for sentence in re.split(r'(?<=[.!?。！？])\s*|\n',assistant_text):
        if ASSUMPTIONS.search(sentence):return 'G-016',f'You wrote: “{sentence.strip()}” Turn this assumption into one ask_choices question and wait for the person’s answer.'
    if required and not re.search(r'^Plan approved:\s*\S',task,re.M):
        return 'G-015','Plan first: write the plan and ask the person to approve it before code changes.'
    section=re.search(r'^## Decisions\s*\n([\s\S]*?)(?=^## |\Z)',task,re.M)
    if section:
        for line in section[1].splitlines():
            if line.strip() and not re.search(r'\((?:chosen|auto|given)(?:\s|:|\))',line):
                return 'G-017',f'This decision is not settled: “{line.strip()}” Ask with ask_choices; record chosen, auto or given.'
    return None
