"""Task 326: the tool-call repair transformer reads the tool calls small models write as text.

The owner (2026-10-18): "let's find a way to make the 4b model use tools like it is advertised it should be able to.
add a transformer that catches poorly made tool calls and formats them properly." The first cases are the texts
gemma4:e4b-mlx and gemma4:26b-mlx really wrote in the owner's chat; the negative cases are what must never become a call."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import unittest

from harness.tool_repair import Failure, Repair, hold_from, repair, validate, ParseError


def tool(name, properties, required=()):
    return {'type': 'function', 'function': {'name': name, 'description': name, 'parameters': {'type': 'object', 'properties': properties, 'required': list(required)}}}


TOOLS = [
    tool('read', {'path': {'type': 'string'}, 'offset': {'type': 'integer'}, 'limit': {'type': 'integer'}}, ['path']),
    tool('write', {'path': {'type': 'string'}, 'content': {'type': 'string'}}, ['path', 'content']),
    tool('bash', {'command': {'type': 'string'}, 'timeout': {'type': 'number'}}, ['command']),
    tool('ask_choices', {'question': {'type': 'string'}, 'options': {'type': 'array'}, 'allow_other': {'type': 'boolean'}}, ['question', 'options']),
]


def calls(result):
    assert isinstance(result, Repair), result
    return [(call['name'], call['arguments']) for call in result.calls]


class SeenInTheOwnersChat(unittest.TestCase):
    def test_execute_tool_with_a_brace_body(self):
        result = repair('I will look at the database code.\n<execute_tool>\nread{path:app/db.py}\n</execute_tool>', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'app/db.py'})])
        self.assertEqual(result.content, 'I will look at the database code.')
        self.assertEqual(result.pattern, 'execute_tool-tag/brace')

    def test_call_tag_with_a_python_call(self):
        result = repair('<call> read(path="app/db.py") </call>', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'app/db.py'})])
        self.assertEqual(result.content, '')
        self.assertEqual(result.pattern, 'call-tag/python')

    def test_bare_call_at_the_end_of_the_answer(self):
        result = repair('Let me read the file first.\n\nread(path="app/db.py")', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'app/db.py'})])
        self.assertEqual(result.content, 'Let me read the file first.')
        self.assertEqual(result.pattern, 'bare/python')

    def test_write_with_a_python_triple_quoted_string_in_a_brace_body(self):
        code = 'import sqlite3\n\ndef connect(path="app.db"):\n    """Open the database."""\n    return sqlite3.connect(path)\n'
        text = f'<execute_tool>\nwrite{{content:"""{code}""",path:app/db.py}}\n</execute_tool>'
        result = repair(text, TOOLS)
        self.assertEqual(calls(result), [('write', {'content': code, 'path': 'app/db.py'})])
        self.assertEqual(json.loads(result.tool_calls()[0]['function']['arguments']), {'content': code, 'path': 'app/db.py'})


class CommonFormats(unittest.TestCase):
    def test_tool_call_tag_with_json(self):
        result = repair('<tool_call>{"name": "bash", "arguments": {"command": "ls -la"}}</tool_call>', TOOLS)
        self.assertEqual(calls(result), [('bash', {'command': 'ls -la'})])
        self.assertEqual(result.pattern, 'tool_call-tag/json')

    def test_json_arguments_given_as_a_string(self):
        result = repair('<tool_call>{"name": "read", "arguments": "{\\"path\\": \\"a.txt\\"}"}</tool_call>', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'a.txt'})])

    def test_tool_code_fence(self):
        result = repair('Checking.\n```tool_code\nbash(command="python3 -m unittest")\n```\nThen I will report.', TOOLS)
        self.assertEqual(calls(result), [('bash', {'command': 'python3 -m unittest'})])
        self.assertEqual(result.content, 'Checking.\n\nThen I will report.')

    def test_json_fence_at_the_end(self):
        result = repair('Reading it.\n```json\n{"name": "read", "parameters": {"path": "README.md"}}\n```', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'README.md'})])
        self.assertEqual(result.pattern, 'fence-json/json')

    def test_python_fence_at_the_end(self):
        result = repair('```python\nread(path="README.md", limit=20)\n```', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'README.md', 'limit': 20})])

    def test_brace_call_with_json_body(self):
        result = repair('read{"path": "a b.txt", "offset": 3}', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'a b.txt', 'offset': 3})])

    def test_gemma_native_format(self):
        result = repair('<|tool_call>call:read{path:<|"|>app/db.py<|"|>}<tool_call|>', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'app/db.py'})])

    def test_bare_value_python_call(self):
        self.assertEqual(calls(repair('read(path=app/db.py)', TOOLS)), [('read', {'path': 'app/db.py'})])

    def test_several_calls_in_one_wrapper_and_several_wrappers(self):
        result = repair('<execute_tool>\nread{path:a.py}\nread{path:b.py}\n</execute_tool>\n<call>bash(command="ls")</call>', TOOLS)
        self.assertEqual(calls(result), [('read', {'path': 'a.py'}), ('read', {'path': 'b.py'}), ('bash', {'command': 'ls'})])

    def test_unclosed_wrapper_at_the_end(self):
        self.assertEqual(calls(repair('<execute_tool>\nread{path:a.py}', TOOLS)), [('read', {'path': 'a.py'})])

    def test_one_positional_value_for_a_tool_with_one_parameter(self):
        tools = [tool('ls', {'path': {'type': 'string'}})]
        self.assertEqual(calls(repair('ls("src")', tools)), [('ls', {'path': 'src'})])

    def test_nested_json_values_and_literals(self):
        result = repair('<call>ask_choices{question:"Which one?",options:[{"label":"A"},{"label":"B"}],allow_other:true}</call>', TOOLS)
        self.assertEqual(calls(result), [('ask_choices', {'question': 'Which one?', 'options': [{'label': 'A'}, {'label': 'B'}], 'allow_other': True})])

    def test_unambiguous_coercions(self):
        self.assertEqual(calls(repair('read{path:a.py,offset:"10"}', TOOLS)), [('read', {'path': 'a.py', 'offset': 10})])
        self.assertEqual(calls(repair('bash{command:"sleep 1",timeout:"2.5"}', TOOLS)), [('bash', {'command': 'sleep 1', 'timeout': 2.5})])
        self.assertEqual(calls(repair('read{path:2024}', TOOLS)), [('read', {'path': '2024'})])


class NeverACall(unittest.TestCase):
    def test_prose_that_mentions_read(self):
        for text in ['I will read app/db.py next, then write the fix.', 'Use the read tool to open a file.',
                     'You can call read(path="x") yourself.', 'The `read` tool returns the file.', 'read the README first']:
            self.assertIsNone(repair(text, TOOLS), text)

    def test_a_code_sample_in_a_markdown_answer(self):
        sample = 'Here is how to load it:\n\n```python\nwith open("app/db.py") as handle:\n    data = read(handle)\n```'
        self.assertIsNone(repair(sample, TOOLS))
        middle = 'Example:\n```python\nread(path="x")\n```\nThat is how the tool is called.'
        self.assertIsNone(repair(middle, TOOLS), 'a fence that does not end the answer is an example')
        javascript = '```js\nread({path: "x"})\n```'
        self.assertIsNone(repair(javascript, TOOLS))

    def test_a_wrapper_shown_as_an_example(self):
        self.assertIsNone(repair('Some models answer like this:\n```xml\n<tool_call>{"name": "read", "arguments": {"path": "a"}}</tool_call>\n```\nPi does not.', TOOLS))
        self.assertIsNone(repair('They write `<call>read(path="a")</call>` instead of a real call.', TOOLS))

    def test_a_line_that_starts_with_a_call_but_goes_on_as_prose(self):
        self.assertIsNone(repair('Done.\nread(path="a") is what I used, and it worked.', TOOLS))

    def test_unknown_tool_names(self):
        self.assertIsNone(repair('delete_everything(path="/")', TOOLS), 'a bare call of a tool not offered is not even a candidate')
        failure = repair('<execute_tool>\ndelete_everything{path:/}\n</execute_tool>', TOOLS)
        self.assertIsInstance(failure, Failure)
        self.assertEqual((failure.reason, failure.tool), ('unknown tool', 'delete_everything'))
        failure = repair('<tool_call>{"name": "rm", "arguments": {}}</tool_call>', TOOLS)
        self.assertEqual((failure.reason, failure.tool), ('unknown tool', 'rm'))

    def test_invalid_arguments(self):
        for text, reason in [('<call>read{offset:3}</call>', 'missing argument path'), ('<call>read{path:a,colour:red}</call>', 'unknown argument colour'),
                             ('<call>read{path:a,offset:"ten"}</call>', 'offset has the wrong type'), ('read(path=["a"])', 'path has the wrong type'),
                             ('<call>read("a", "b")</call>', 'unreadable call: positional arguments')]:
            failure = repair(text, TOOLS)
            self.assertIsInstance(failure, Failure, text)
            self.assertIn(reason.split(':')[-1].strip(), failure.reason, text)

    def test_unreadable_call(self):
        failure = repair('Now:\nread(path="app/db.py"', TOOLS)
        self.assertIsInstance(failure, Failure)
        self.assertEqual(failure.pattern, 'bare')

    def test_no_tools_offered_and_empty_content(self):
        self.assertIsNone(repair('read(path="a")', []))
        self.assertIsNone(repair('', TOOLS))
        self.assertIsNone(repair(None, TOOLS))

    def test_validate_directly(self):
        self.assertEqual(validate('t', {'n': '5'}, {'properties': {'n': {'type': 'integer'}}}), {'n': 5})
        with self.assertRaises(ParseError): validate('t', {'n': True}, {'properties': {'n': {'type': 'integer'}}})
        with self.assertRaises(ParseError): validate('t', {'mode': 'x'}, {'properties': {'mode': {'type': 'string', 'enum': ['a', 'b']}}})


PROPOSE_PLAN = {'type': 'function', 'function': {'name': 'propose_plan', 'parameters': {  # harness/planning.mjs
    'type': 'object', 'properties': {'goal': {'type': 'string'}, 'tasks': {'type': 'array', 'items': {'type': 'object', 'properties': {
        'title': {'type': 'string'}, 'kind': {'type': 'string', 'enum': ['code', 'docs', 'chore']}, 'files': {'type': 'array', 'items': {'type': 'string'}},
        'done_when': {'type': 'string'}, 'content': {'type': 'string'}}, 'required': ['title', 'files', 'done_when', 'content']}}}}}}
STEPS = ('1. Define … to app/db.py.\n2. Add all CRUD functions for habits and daily logs (e.g., `get_all_habits`, `mark_complete`, '
         '`daily_completion_counts`) to app/db.py.\n3. Create a new migration file migrations/002-habits.sql …\n4. Ensure the `connect()` '
         'function … (by creating them with `IF NOT EXISTS`).')
DONE = 'The database is capable of storing and querying habits and daily logs; a test verifies the new functionality.'
# gemma4:e4b-mlx on the owner's build (da0063f): Ollama's decode dropped the <|"|> quote tokens, so no value is quoted.
LIVE = ('Here is the plan.call:propose_plan{goal:…,tasks:[{steps:' + STEPS + ',done_when:' + DONE +
        ',files:[app/db.py,migrations/002-habits.sql],kind:code,title:003-Implement Data Model and Database Schema}]}<tool_call|>')


class GemmaNativeWithoutQuotes(unittest.TestCase):
    """Gemma's own `call:name{…}` with its quote tokens lost: the offered tool's schema says where each value ends."""

    def test_the_live_sample_is_repaired_with_the_known_synonym_steps_for_content(self):
        """2026-10-19: the model named propose_plan's task `content` `steps`; System 1's fixed synonym list maps it."""
        result = repair(LIVE, TOOLS + [PROPOSE_PLAN])
        task = calls(result)[0][1]['tasks'][0]
        self.assertEqual((task['content'], task['kind'], task['files']), (STEPS, 'code', ['app/db.py', 'migrations/002-habits.sql']))
        self.assertNotIn('steps', task)

    def test_an_unknown_key_that_is_no_known_synonym_still_keeps_it_text(self):
        failure = repair(LIVE.replace('{steps:', '{bullets:'), TOOLS + [PROPOSE_PLAN])
        self.assertIsInstance(failure, Failure)
        self.assertIn('unknown argument tasks[0].bullets', failure.reason)

    def test_the_live_sample_splits_exactly_at_known_keys(self):
        schema = json.loads(json.dumps(PROPOSE_PLAN))
        item = schema['function']['parameters']['properties']['tasks']['items']
        item['properties']['steps'] = {'type': 'string'}; item['required'] = ['title', 'files', 'done_when']
        result = repair(LIVE, [schema])
        self.assertEqual(calls(result), [('propose_plan', {'goal': '…', 'tasks': [{'steps': STEPS, 'done_when': DONE, 'files': ['app/db.py', 'migrations/002-habits.sql'],
                                                                                'kind': 'code', 'title': '003-Implement Data Model and Database Schema'}]})])
        self.assertEqual(result.content, 'Here is the plan.')

    def test_scenario_synonyms_small_models_use_are_known(self):
        """Task 329: `user_stories` (or `stories`) for scenarios, `name` for a scenario's title."""
        schema = json.loads(json.dumps(PROPOSE_PLAN))['function']['parameters']
        schema['properties']['tasks']['items']['properties']['scenarios'] = {'type': 'array', 'items': {'type': 'object', 'properties': {
            'title': {'type': 'string'}, 'given': {'type': 'string'}, 'when': {'type': 'string'}, 'then': {'type': 'string'}}, 'required': ['title', 'given', 'when', 'then']}}
        task = {'title': 'Notes', 'files': ['index.html'], 'done_when': 'x', 'content': 'y',
                'user_stories': [{'name': 'Add a note', 'given': 'a', 'when': 'b', 'then': 'c'}]}
        checked = validate('propose_plan', {'goal': 'g', 'tasks': [task]}, schema)
        self.assertEqual(checked['tasks'][0]['scenarios'], [{'title': 'Add a note', 'given': 'a', 'when': 'b', 'then': 'c'}])

    def test_the_same_plan_with_the_right_key_is_repaired(self):
        result = repair(LIVE.replace('{steps:', '{content:'), [PROPOSE_PLAN])
        task = calls(result)[0][1]['tasks'][0]
        self.assertEqual((task['content'], task['kind'], task['files']), (STEPS, 'code', ['app/db.py', 'migrations/002-habits.sql']))

    def test_with_the_opening_tag_and_with_or_without_quote_tokens(self):
        quoted = '<|tool_call>call:propose_plan{goal:<|"|>Habits<|"|>,tasks:[{content:<|"|>a, b: c<|"|>,done_when:<|"|>works<|"|>,files:[<|"|>app/db.py<|"|>],kind:<|"|>Code<|"|>,title:<|"|>Data<|"|>}]}<tool_call|>'
        bare = quoted.replace('<|"|>', '').replace('a, b: c', 'a, b and c')
        for text in (quoted, bare):
            task = calls(repair(text, [PROPOSE_PLAN]))[0][1]['tasks'][0]
            self.assertEqual((task['files'], task['kind'], task['title']), (['app/db.py'], 'code', 'Data'), text)
        self.assertEqual(calls(repair(quoted, [PROPOSE_PLAN]))[0][1]['tasks'][0]['content'], 'a, b: c', 'a quoted value keeps its commas and colons')
        failure = repair(quoted.replace('<|"|>', ''), [PROPOSE_PLAN])
        self.assertEqual((type(failure), failure.reason), (Failure, 'unreadable call: unknown argument b'), 'unquoted, `a, b: c` may be a key b: left as text')

    def test_read_and_write_without_quote_tokens(self):
        self.assertEqual(calls(repair('Reading it.\ncall:read{path:app/db.py}<tool_call|>', TOOLS)), [('read', {'path': 'app/db.py'})])
        code = 'import os\nprint("hi, there")  # it\'s a test, path: none\n'
        result = repair('<|tool_call>call:write{content:' + code + ',path:app/x.py}<tool_call|>', TOOLS)
        self.assertEqual(calls(result), [('write', {'content': code, 'path': 'app/x.py'})], 'newlines, commas, quotes and an apostrophe stay in the value')
        self.assertEqual(calls(repair('Writing.call:write{path:a.txt,content:one, two}', TOOLS)), [('write', {'path': 'a.txt', 'content': 'one, two'})], 'at the very end, no tags at all')

    def test_still_text_when_it_cannot_mean_one_thing(self):
        self.assertIsInstance(repair('call:propose_plan{goal:x,tasks:[{content:a,done_when:b,files:[a],kind:poem,title:t}]}<tool_call|>', [PROPOSE_PLAN]), Failure, 'not one of the kinds')
        self.assertIsInstance(repair('call:propose_plan{goal:x,tasks:[{content:a,done_when:b}]}<tool_call|>', [PROPOSE_PLAN]), Failure, 'required keys missing')
        self.assertIsNone(repair('I would call:propose_plan later, maybe.', [PROPOSE_PLAN]), 'prose')


class Streaming(unittest.TestCase):
    """hold_from: the text before a possible pseudo call streams at once; the rest waits for the end of the turn."""

    def test_prose_streams_and_calls_are_held(self):
        self.assertEqual(hold_from('Plain answer with no call.', TOOLS), len('Plain answer with no call.'))
        text = 'Reading.\n<execute_tool>\nread{'
        self.assertEqual(hold_from(text, TOOLS), len('Reading.'))
        self.assertEqual(hold_from('Reading.\nrea', TOOLS), len('Reading.'), 'a line that may become a call waits, with the line break before it')
        self.assertEqual(hold_from('Reading.\nreally', TOOLS), len('Reading.\nreally'), 'and is released when it cannot')
        self.assertEqual(hold_from('Look: <', TOOLS), len('Look:'))
        self.assertEqual(hold_from('Look: <b>bold</b>', TOOLS), len('Look: <b>bold</b>'))
        self.assertEqual(hold_from('Code:\n```js\nx()\n```', TOOLS), len('Code:\n```js\nx()\n```'))
        self.assertEqual(hold_from('Code:\n```py', TOOLS), len('Code:'))
        self.assertEqual(hold_from('Then `', TOOLS), len('Then'))
        self.assertEqual(hold_from('Done.\n\n', TOOLS), len('Done.'))

    def test_every_repaired_span_starts_after_what_was_streamed(self):
        texts = ['I will look.\n<execute_tool>\nread{path:app/db.py}\n</execute_tool>', 'Let me read it.\n\nread(path="app/db.py")',
                 'Reading.\n```json\n{"name": "read", "arguments": {"path": "a"}}\n```', '<|tool_call>call:read{path:<|"|>a<|"|>}<tool_call|>',
                 LIVE.replace('{steps:', '{content:'), 'Writing.call:write{path:a.txt,content:one, two}', 'Reading it.\ncall:read{path:app/db.py}<tool_call|>']
        for text in texts:
            result = repair(text, TOOLS + [PROPOSE_PLAN])
            for size in range(len(text) + 1):  # however the text arrived in pieces
                streamed = min(hold_from(text[:size], TOOLS + [PROPOSE_PLAN]), size)
                self.assertLessEqual(streamed, result.spans[0][0], (text, size))


if __name__ == '__main__':
    unittest.main()
