"""Task 324 (the owner: "go for the planning. I think this should be automatic when clicking on the planning button";
"I asked in plan mode to start planning ... it didn't start the agent"). Choosing a phase with the person's phase
control is System 1's decision to start the work that phase is for, so the person never has to type again:

- Discussion → Planning, with a discussion in the chat: one request "Write the plan from our discussion." is queued
  (after a running one). The chat shows it as the harness's notice, not as the person's words. An empty chat starts
  nothing (the composer's Planning hint says what to do).
- Into Implementation with an approved task in progress (Start Building already starts its own request): "Build the
  approved task." is queued the same way.

Pi never changes the phase; only the person's control reaches this (PERSON_ROUTES)."""

PLAN_MESSAGE = 'Write the plan from our discussion.'
PLAN_NOTICE = 'Planning started from your discussion'
BUILD_MESSAGE = 'Build the approved task.'
BUILD_NOTICE = 'Building started: the approved task'


def discussed(conversation):
    """The person said something in this chat (their own words, not a control or an answer to a card)."""
    return any(message.get('role') == 'user' and not message.get('harness') and str(message.get('content') or '').strip()
               and not str(message.get('content')).startswith('Choice: ') for message in conversation.get('messages', []))


def after_phase_change(chat, project, before, after):
    """Queue the request the new phase starts, or None. `before`/`after`: the phase names around the person's choice."""
    if before == after: return None
    conversation = chat.project_chat(project)
    if after == 'planning' and before == 'discussion' and discussed(conversation):
        message, notice, control = PLAN_MESSAGE, PLAN_NOTICE, 'plan'
    elif after == 'implementation':
        message, notice, control = BUILD_MESSAGE, BUILD_NOTICE, 'build'
    else: return None
    if any(job['status'] in ('queued', 'running') and job.get('chat') == conversation['id'] and job.get('message') == message for job in chat.queue.list()):
        return None  # already on its way (a double click, a second tab)
    job = chat.queue.add(project, conversation['id'], {'message': message, 'control': control, 'harness': notice})
    from harness.decision_log import record
    record(chat.documents.root, job['id'], 'phase_start', 'code', control, rule='phase_start.' + after, automatic=True)
    return job
