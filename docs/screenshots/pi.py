"""A stand-in for Pi that answers the screenshot's two questions (docs/screenshots/make.cjs). Never used by the app."""
import json
import sys
request = json.loads(sys.stdin.readline())
def emit(value): print(json.dumps(value), flush=True)
emit({'type': 'agent_start'})
message = request['message']
if 'search' in message:
    text = ('I added a search field above the list. It filters the notes as you type, and it works offline like the rest '
            'of the app.\n\n- **Changed:** `index.html`, `js/app.mjs`, `js/logic/notes.mjs`\n- **Checked:** 6 tests pass, '
            'and the page shows the field in English and Japanese.\n\nTry it in the Preview on the right.')
else:
    text = ('Here is the plan for **Class Notes**:\n\n1. Notes with a title, saved on this device.\n2. A search field that '
            'filters them.\n3. A backup you can save and restore.\n\nThe first step is done: the starter already saves notes.')
emit({'type': 'message_update', 'assistantMessageEvent': {'type': 'thinking_delta', 'delta': 'Reading the project.'}})
emit({'type': 'message_update', 'assistantMessageEvent': {'type': 'text_delta', 'delta': text}})
emit({'type': 'message_end', 'message': {'role': 'assistant', 'content': [{'type': 'text', 'text': text}], 'stopReason': 'stop'}})
emit({'type': 'agent_settled'})
sys.stdin.readline()
