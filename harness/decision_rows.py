"""The decision row (plan 267 section 3, task 273): the judgements behind one answer, each with its author.

One record for every surface (the web's DecisionRow under an answer, terminal Pi's /decisions): what was decided, the
answer, who decided it (you, auto, Laya, code, model), why in one line (the rule or Laya's confidence), when, and whether
it can still be changed and what changing it redoes. Built from <data>/decisions.jsonl, joined to an answer by its
request id, and from the answer's own record (the questions it asked, with their words, which the log does not keep).

Settings › Pi › Detail (config.json `detail`): beginner hides the decisions code made; expert shows every decision with
its rule, Laya's confidence and the command or path a refusal was about (from gate-events.jsonl, never from this log).
"""
from datetime import datetime
import json
from pathlib import Path

from harness import autonomy
from harness.decision_log import record

AUTHORS = {'person': 'you', 'laya': 'Laya', 'code': 'code', 'model': 'model'}
AUTOMATIC = ('auto', 'model')  # drawn dotted, counted as automatic ("5 decisions · 2 automatic")
NAMES = {
    'question_answer': 'Question', 'recommendation': 'Recommended option', 'task_kind': 'Kind', 'task_files': 'Files',
    'plan_layout': 'Plan', 'plan_approval': 'Plan approval', 'phase': 'Phase', 'task_acceptance': 'Check-in',
    'task_reopen': 'Task reopened', 'box_ticked': 'Boxes ticked', 'step_done': 'Task done', 'guide_chosen': 'Guide',
    'applicable_guide': 'Guide', 'waiting_reply': 'Your reply', 'phase_intent': 'Phase asked for',
    'assumed_value': 'Stated value', 'shell_risk': 'Command risk', 'command_allowed': 'Command', 'tool_permission': 'Tool',
    'tool_audit': 'Tool check', 'theme_panel': 'Theme panel', 'queue_edit': 'Waiting message', 'queue_remove': 'Waiting message',
}
OUTCOMES = {'BLOCK': 'refused', 'REVISE': 'sent back', 'ESCALATE': 'asked you', 'EXECUTION_FAILED': 'failed',
            'DRIFT_DETECTED': 'changed after approval', 'POSTCONDITION_FAILED': 'check failed', 'UNAVAILABLE': 'not checked'}
ACCEPTANCE = {'accept': 'accepted', 'stop': 'stopped here', 'retry': 'retry the task'}
# Why a decision cannot be changed from its row, by author (the row still shows Change…, disabled, with this reason).
WHY_NOT = {
    'code': 'Gate decided this by its rule; change what it checks instead.',
    'Laya': 'Laya’s reading only advises; there is nothing to redo.',
    'model': 'Pi proposed this; change it on the plan with Change….',
    'you': 'Change this with the control that made it.',
    'auto': 'Run on its own took the recommendation; change it with the control that made it.',
}
MERGED = {'box_ticked', 'command_allowed', 'tool_permission', 'tool_audit', 'recommendation'}


def detail_level(data):
    value = autonomy.read(Path(data) / 'config.json', {}).get('detail')
    return value if value in ('beginner', 'expert') else 'beginner'


def _lines(path):
    try: text = Path(path).read_text(encoding='utf-8')
    except OSError: return []
    rows = []
    for line in text.splitlines():
        try: row = json.loads(line)
        except ValueError: continue
        if isinstance(row, dict): rows.append(row)
    return rows


def records(data, request=None):
    """decisions.jsonl rows; with `request`, that request's and its chained ones' (`<request>.<suffix>`)."""
    rows = _lines(Path(data) / 'decisions.jsonl')
    return rows if request is None else [row for row in rows if belongs(row.get('request'), request)]


def belongs(value, request):
    return isinstance(value, str) and bool(request) and (value == request or value.startswith(request + '.'))


def _value(row):
    kind, answer = row.get('kind'), row.get('answer')
    if kind in ('question_answer', 'recommendation') and isinstance(answer, dict) and isinstance(answer.get('option'), int):
        return 'the first option' if kind == 'recommendation' and answer['option'] == 0 else f"option {answer['option'] + 1}"
    if answer == 'other': return 'your words'
    if kind == 'task_files' and isinstance(answer, int): return f'{answer} file' + ('' if answer == 1 else 's')
    if kind == 'plan_layout' and isinstance(answer, int): return f'{answer} task' + ('' if answer == 1 else 's')
    if kind == 'box_ticked' and isinstance(answer, int): return f'{answer} ticked'
    if kind == 'phase' and isinstance(answer, str): return answer.capitalize()
    if kind == 'task_acceptance': return ACCEPTANCE.get(answer, str(answer))
    if kind == 'step_done': return 'verified and committed'
    if kind == 'guide_chosen': return ', '.join(answer) if isinstance(answer, list) and answer else 'none'
    if kind in ('command_allowed', 'tool_permission', 'tool_audit'): return OUTCOMES.get(answer, str(answer))
    if isinstance(answer, bool): return 'yes' if answer else 'no'
    return str(answer)


def author(row):
    if row.get('automatic'): return 'auto'
    return AUTHORS.get(row.get('who'), 'code')


def _row(name, value, who, *, kind, time=None, rule=None, confidence=None, detail=None, change=None, why=None, words=False):
    row = {'kind': kind, 'name': name, 'value': value, 'who': who, 'time': time}
    if rule: row['rule'] = rule
    if confidence is not None: row['confidence'] = confidence
    if detail: row['detail'] = detail
    if words: row['words'] = True  # the name and value are the person's or Pi's words, never translated
    if change: row['change'] = change
    else: row['why'] = why or WHY_NOT.get(who, WHY_NOT['code'])
    return row


def message_rows(message, index):
    """The questions an answer asked, with their words: answered in the turn (auto or terminal) or on its card."""
    rows = []
    for position, item in enumerate(message.get('decisions') or []):
        if not isinstance(item, dict) or not item.get('question') or not item.get('answer'): continue
        who = 'auto' if item.get('state') == 'auto' else 'you'
        rows.append(_row(item['question'], item['answer'], who, kind='question_answer', time=item.get('when'), words=True,
                         change={'type': 'question', 'index': index, 'source': 'decision', 'position': position, 'redoes': item.get('task')}))
    choice = message.get('choice')
    if isinstance(choice, dict) and choice.get('question'):
        if choice.get('answer'):
            who = 'auto' if choice.get('state') == 'auto' else 'you'
            rows.append(_row(choice['question'], choice['answer'], who, kind='question_answer', time=choice.get('when'), words=True,
                             change={'type': 'question', 'index': index, 'source': 'choice', 'redoes': choice.get('task')}))
        elif choice.get('settled'):
            rows.append(_row(choice['question'], 'not answered', 'you', kind='question_answer', time=choice.get('when'), words=True,
                             detail=f"settled by {choice['settled']}", change={'type': 'question', 'index': index, 'source': 'choice', 'redoes': choice.get('task')}))
    return rows


def record_rows(rows, message, events=None):
    """Rows from the log for one answer: Laya abstentions are left out (whoever then decided has the row), repeats of
    the same refusal or tick are one row with a count, and each says whether it can be changed here."""
    events = events or {}
    found = []
    for item in rows:
        if item.get('abstained'): continue
        who, kind = author(item), item.get('kind')
        value = _value(item)
        last = found[-1] if found else None
        if last and kind in MERGED and last['kind'] == kind and last['who'] == who and last.get('rule') == item.get('rule') and last['_value'] == value:
            last['count'] = last.get('count', 1) + 1; last['value'] = f"{value} ×{last['count']}"; last['time'] = item.get('time'); continue
        change = None
        if kind == 'phase' and who in ('you', 'auto'): change = {'type': 'phase', 'value': item.get('answer')}
        check = message.get('check_in') if isinstance(message.get('check_in'), dict) else {}
        if kind == 'task_acceptance' and item.get('answer') == 'accept' and check.get('task'): change = {'type': 'reopen', 'task': check['task']}
        event = events.get(item.get('event'))
        detail = None
        if event: detail = ' · '.join(str(value) for value in (event.get('tool'), *(event.get('args') or {}).values()) if value)
        row = _row(NAMES.get(kind, str(kind).replace('_', ' ').capitalize()), value, who, kind=kind, time=item.get('time'),
                   rule=item.get('rule'), confidence=item.get('confidence'), detail=detail, change=change,
                   why='Plan Another Task or a new plan changes an approved plan.' if kind == 'plan_approval' else None)
        row['_value'] = value
        found.append(row)
    for row in found: row.pop('_value', None)
    return found


def summary(rows):
    return {'rows': rows, 'total': len(rows), 'automatic': sum(row['who'] in AUTOMATIC for row in rows)}


def visible(rows, detail):
    """Beginner: plain words, decisions made by code hidden; expert: all, with rules, confidence and paths."""
    if detail == 'expert': return rows
    return [{key: value for key, value in row.items() if key not in ('rule', 'confidence') and not (key == 'detail' and row['kind'] != 'question_answer')}
            for row in rows if row['who'] != 'code']


def test_evidence(data, request):
    """What Gate holds as evidence for an answer's check-in (the check-ins card shows it): its last test run."""
    runs = [row for row in _lines(Path(data) / 'test-runs.jsonl') if belongs(row.get('request'), request)]
    if not runs: return None
    run = runs[-1]
    return {'test_run': {key: run.get(key) for key in ('command', 'counts', 'exit_code', 'duration', 'time')}, 'test_runs': len(runs)}


def conversation(data, value, detail=None):
    """{index: {rows, total, automatic, evidence}} for each assistant message with a request (task 273)."""
    detail = detail or detail_level(data)
    log = records(data)
    events = {event.get('id'): event for event in _lines(Path(data) / 'gate-events.jsonl') if detail == 'expert'}
    messages = value.get('messages') or []
    answering = {message['choice'].get('job') for message in messages if isinstance(message.get('choice'), dict) and message['choice'].get('job')}
    result = {}
    for index, message in enumerate(messages):
        if message.get('role') != 'assistant': continue
        request = message.get('request')
        mine = [row for row in log if belongs(row.get('request'), request)] if request else []
        if request in answering: mine = [row for row in mine if row.get('kind') != 'question_answer']  # shown on the question's card
        rows = visible(message_rows(message, index) + record_rows(mine, message, events), detail)
        evidence = test_evidence(data, request) if request else None
        if rows or evidence: result[str(index)] = {**summary(rows), **({'evidence': evidence} if evidence else {})}
    return {'detail': detail, 'messages': result}


# -- Change… on a question's answer (person only: PERSON_ROUTES) -------------------------------------------------------
def change_answer(chat, project, data):
    """The person changes a question's answer from its decision row: the new answer is recorded as theirs, the task's
    Decisions line follows, and one request asks Pi to redo what depended on it ("Change and Redo")."""
    from harness.web_chat import timestamp
    index, source = data.get('index'), data.get('source')
    if source not in ('choice', 'decision'): raise ValueError('Name the decision you change.')
    conversation_id = chat.project_chat(project)['id']
    with chat.store.lock:
        value = chat.store.get(conversation_id)
        if not isinstance(index, int) or isinstance(index, bool) or not 0 <= index < len(value['messages']): raise ValueError('Decision not found.')
        message = value['messages'][index]
        if source == 'choice': item = message.get('choice')
        else:
            items = message.get('decisions') or []; position = data.get('position')
            item = items[position] if isinstance(position, int) and not isinstance(position, bool) and 0 <= position < len(items) else None
        if not isinstance(item, dict) or not item.get('question'): raise ValueError('Decision not found.')
        if source == 'choice' and not item.get('answer') and not item.get('settled'): raise ValueError('Answer the question on its card.')
        labels = [option.get('label', '') for option in item.get('options') or [] if isinstance(option, dict)]
        option = data.get('option')
        if isinstance(option, int) and not isinstance(option, bool) and 0 <= option < len(labels): answer = labels[option]
        else:
            answer = ' '.join(str(data.get('text') or '').split())
            if not answer: raise ValueError('Choose an option or write your answer.')
            if len(answer) > 2000: raise ValueError('Keep the answer under 2,000 characters.')
        previous = item.get('answer')
        if answer == previous: raise ValueError('That is already the answer.')
        record(chat.documents.root, message.get('request'), 'question_answer', 'person', {'option': labels.index(answer)} if answer in labels else 'other', rule='decision.change')
        ledger = getattr(chat, 'ledger', None); task = item.get('task')
        if ledger and isinstance(task, str):
            root = chat.documents.project_path(project)
            try:
                if (root / task).is_file() and (root / task).resolve().is_relative_to(root):
                    ledger.paperwork.write_decision(root, task, {'question': item['question'], 'answer': answer, 'state': 'chosen', 'at': datetime.now().astimezone().isoformat(timespec='seconds')})
            except (OSError, ValueError): pass
        was = f' (was {previous})' if previous else ' (it was not answered)'
        job = chat.queue.add(project, conversation_id, {'message': f"Change: {item['question']} → {answer}{was}. Redo what depended on it.", 'control': 'Change'})
        item.update(answer=answer, state='chosen', when=timestamp(), changed_from=previous or '', job=job['id'])
        item.pop('settled', None)
        value = chat.store.save(value)
    return {'answer': answer, 'job': job['id'], 'conversation': value}


# -- Take All Recommendations on a batch of questions ("2 of 3") ----------------------------------------------------------
def take_all(chat, conversation_id, choice):
    """The person chose Take All Recommendations on a numbered question: the rest of its batch takes each recommendation."""
    total = choice.get('total')
    if isinstance(total, int) and isinstance(choice.get('number'), int) and choice['number'] < total:
        chat.__dict__.setdefault('batch_recommendations', {})[conversation_id] = total


def take_next(chat, project, conversation_id, choice, emit):
    """After a request paused on the next question of such a batch: its recommendation (the first option), as the person's
    answer, so the batch goes on without stopping. True when it answered."""
    batches = chat.__dict__.get('batch_recommendations', {})
    total = batches.get(conversation_id)
    number = choice.get('number') if isinstance(choice, dict) else None
    if not total or not isinstance(number, int) or choice.get('total') != total:
        batches.pop(conversation_id, None); return False
    if number >= total: batches.pop(conversation_id, None)
    result = chat.answer_choice(project, {'id': choice.get('id'), 'option': 0, 'key': 'take-all-' + str(choice.get('id'))})
    if result.get('stale'): return False
    emit({'type': 'choice', **choice, 'pending': False, 'answer': result.get('answer')})  # the request is not left waiting
    return True


# -- terminal Pi's /decisions (board T_Decisions) -----------------------------------------------------------------------
def local(stamp):
    """The log's UTC time in this Mac's time zone, as the boards write times."""
    try: return datetime.fromisoformat(str(stamp)).astimezone().isoformat(timespec='seconds')
    except ValueError: return stamp


def latest_request(data):
    for row in reversed(records(data)):
        if isinstance(row.get('request'), str) and not row.get('abstained'): return row['request'].split('.')[0]
    return None


def terminal(data, args):
    """(data, view) for /decisions [--all] [request]: the request's decisions with their authors; "~" marks automatic."""
    from harness.admin import view, short_time
    expert = '--all' in args or detail_level(data) == 'expert'
    words = [word for word in args if word != '--all']
    if words[:1] == ['change']:
        return None, view('Decisions', {'kind': 'lines', 'lines': ['Change a decision with Change… under the answer in the web chat; it says what it redoes.']}, hint='/decisions · /decisions --all')
    request = words[0] if words else latest_request(data)
    if not request: return {'rows': []}, view('Decisions', {'kind': 'lines', 'lines': ['No decisions recorded yet.']})
    events = {event.get('id'): event for event in _lines(Path(data) / 'gate-events.jsonl')} if expert else {}
    rows = visible(record_rows(records(data, request), {}, events), 'expert' if expert else 'beginner')
    counted = summary(rows)
    width = max([len(row['name']) for row in rows] + [4])
    lines = []
    for row in rows:
        mark = '~' if row['who'] in AUTOMATIC else '✓'
        extra = ' · '.join(str(value) for value in (row.get('rule'), f"{row['confidence']:.2f}" if isinstance(row.get('confidence'), (int, float)) else None, row.get('detail')) if value) if expert else ''
        lines.append(f"{mark} {row['name'].ljust(width)}  {row['value'][:40].ljust(30)}  {row['who'].ljust(6)} {short_time(local(row.get('time')))}" + (f'  {extra}' if extra else ''))
    return counted, view(f'Decisions · {request[:8]}', {'kind': 'lines', 'lines': lines or ['No decisions shown (decisions made by code: /decisions --all).']},
                         summary=f"{counted['total']} · {counted['automatic']} automatic", hint='/decisions change <name> · /decisions --all for paths and commands')
