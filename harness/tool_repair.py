"""Tool-call repair (task 326): System 1 turns the tool calls a small model wrote as text into real calls.

Small local models (gemma4:e4b-mlx, sometimes gemma4:26b-mlx) often answer a request that offered tools with text such as
`<execute_tool>read{path:app/db.py}</execute_tool>` or a bare `read(path="app/db.py")` on the last line, instead of the
OpenAI `tool_calls` field. Pi then sees a plain answer and nothing runs. `repair(content, tools)` reads such text and,
when it is certainly a call of an offered tool with arguments that fit the tool's JSON schema, returns well-formed calls
and the content without the pseudo call. It never invents a call: an unknown tool, prose that only mentions a tool, a
code sample, or arguments that do not fit leave the content as it is (a `Failure` says why, for the log).

Where a call may be:
- anywhere, inside a tool wrapper: `<execute_tool>`, `<tool_call>`, `<call>`, `<function_call>`, `<tool_code>`,
  `<tool_use>`, Gemma's own `<|tool_call>…<tool_call|>`, or a ```tool_code / ```tool_call fence;
- only at the very end of the answer: a ```json / ```python / plain fence, or a bare call on its own last line(s).
Bodies: JSON (`{"name": …, "arguments": {…}}`, lists of them), Python calls (`read(path="x")`, triple-quoted strings),
and brace calls (`read{path:app/db.py}`, `write{content:\"\"\"…\"\"\",path:x}`, Gemma's `<|"|>` quotes).

`hold_from(content, tools)` is the streaming side: the earliest index where a pseudo call could begin, so the proxy
streams the text before it live and holds the rest until the turn ends (harness/tool_repair_proxy.py).
"""
import ast
import json
import re
import uuid

TAGS = ('execute_tool', 'function_call', 'tool_call', 'tool_code', 'tool_use', 'call', 'tool')
TOOL_FENCES = ('tool_code', 'tool_call', 'tool_use', 'function_call', 'tool')
END_FENCES = ('json', 'python', 'py', '')  # only when the fence ends the answer
GEMMA_QUOTE = '<|"|>'
_OPEN = re.compile(r'<\|?(' + '|'.join(TAGS) + r')\|?>')
_FENCE = re.compile(r'```([\w-]*)[ \t]*\n(.*?)\n?[ \t]*```', re.S)
_IDENT = re.compile(r'[A-Za-z_][\w.-]*')
_KEY = re.compile(r'\s*(?:"[^"\\]*"|\'[^\'\\]*\'|[A-Za-z_][\w-]*)\s*[:=]')
_NUMBER = re.compile(r'-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?')
_LITERALS = {'true': True, 'false': False, 'null': None, 'True': True, 'False': False, 'None': None}


class ParseError(ValueError):
    pass


class Failure:
    """A pseudo call was found but not repaired: why, which pattern, and the tool it named (never the content)."""
    def __init__(self, reason, pattern, tool=None):
        self.reason, self.pattern, self.tool = reason, pattern, tool

    def __repr__(self):
        return f'Failure({self.reason!r}, {self.pattern!r}, {self.tool!r})'


class Repair:
    """calls: [{'name', 'arguments' (dict)}]; content: the answer without the pseudo calls; spans: what was removed."""
    def __init__(self, calls, content, spans, pattern):
        self.calls, self.content, self.spans, self.pattern = calls, content, spans, pattern

    def tool_calls(self):
        """The calls in OpenAI's shape, with fresh ids."""
        return [{'id': 'call_' + uuid.uuid4().hex[:24], 'type': 'function',
                 'function': {'name': call['name'], 'arguments': json.dumps(call['arguments'], ensure_ascii=False)}} for call in self.calls]


def offered(tools):
    """{name: parameters schema} of the tools a request offered (OpenAI's `tools` array)."""
    found = {}
    for tool in tools or []:
        function = tool.get('function') if isinstance(tool, dict) else None
        if isinstance(function, dict) and isinstance(function.get('name'), str):
            found[function['name']] = function.get('parameters') if isinstance(function.get('parameters'), dict) else {}
    return found


# -- scanning --------------------------------------------------------------------------------------------------------
def _string_end(text, start):
    """The index after the string literal starting at `start` (', ", ''', \"\"\" or Gemma's <|"|>)."""
    if text.startswith(GEMMA_QUOTE, start):
        end = text.find(GEMMA_QUOTE, start + len(GEMMA_QUOTE))
        if end < 0: raise ParseError('unclosed string')
        return end + len(GEMMA_QUOTE)
    quote = text[start]
    if text.startswith(quote * 3, start):
        # File content often holds triple quotes itself (a docstring): the string ends at the first closing triple quote
        # followed by what may follow a value (`, key:`, a closing bracket, the end), else at the last one.
        index, last = start + 3, None
        while True:
            end = text.find(quote * 3, index)
            if end < 0: break
            while text.startswith(quote, end + 3): end += 1  # """" ends with the last three
            rest = text[end + 3:].lstrip(' \t')
            if text[end - 1] != '\\':
                last = end + 3
                if not rest or rest[0] in ')}]' or (rest[0] in ',;' and (_KEY.match(rest, 1) or not rest[1:].strip())): return end + 3
            index = end + 3
        if last is None: raise ParseError('unclosed string')
        return last
    index = start + 1
    while index < len(text):
        if text[index] == '\\': index += 2; continue
        if text[index] == quote: return index + 1
        if text[index] == '\n' and quote == "'": break  # an apostrophe in prose is not a string
        index += 1
    raise ParseError('unclosed string')


def _balanced_end(text, start):
    """The index after the bracket group opening at `start`, skipping strings."""
    pairs, stack, index = {'(': ')', '{': '}', '[': ']'}, [], start
    while index < len(text):
        char = text[index]
        if char in '"\'' or text.startswith(GEMMA_QUOTE, index):
            index = _string_end(text, index); continue
        if char in pairs: stack.append(pairs[char])
        elif char in ')}]':
            if not stack or stack.pop() != char: raise ParseError('unbalanced brackets')
            if not stack: return index + 1
        index += 1
    raise ParseError('unclosed brackets')


def _decode_string(literal):
    if literal.startswith(GEMMA_QUOTE): return literal[len(GEMMA_QUOTE):-len(GEMMA_QUOTE)]
    if literal[:3] in ('"""', "'''"): return literal[3:-3]  # file content as written: its backslashes are the file's
    if literal[0] == '"':
        try: return json.loads(literal)
        except ValueError: pass
    try: return ast.literal_eval(literal)
    except (ValueError, SyntaxError): return literal[1:-1]


def _literal(text):
    """A JSON or Python literal (dict, list, string, number, true/false/null)."""
    try: return json.loads(text)
    except ValueError: pass
    try: tree = ast.parse(text.strip(), mode='eval')
    except SyntaxError as error: raise ParseError('not a literal') from error
    return _node_value(tree.body)


def _node_value(node):
    if isinstance(node, ast.Name) and node.id in _LITERALS: return _LITERALS[node.id]
    if isinstance(node, ast.Dict): return {_node_value(key): _node_value(value) for key, value in zip(node.keys, node.values)}
    if isinstance(node, (ast.List, ast.Tuple)): return [_node_value(item) for item in node.elts]
    try: return ast.literal_eval(node)
    except ValueError as error: raise ParseError('not a literal') from error


# -- bodies ----------------------------------------------------------------------------------------------------------
def _pairs(text, separators):
    """`key: value, key2 = "value"` (relaxed: bare values, triple quotes, nested JSON) into a dict."""
    result, index = {}, 0
    while True:
        while index < len(text) and (text[index].isspace() or text[index] in ',;'): index += 1
        if index >= len(text): return result
        if text[index] in '"\'':
            end = _string_end(text, index); key = _decode_string(text[index:end])
        else:
            found = _IDENT.match(text, index)
            if not found: raise ParseError('no key')
            key, end = found.group(), found.end()
        index = end
        while index < len(text) and text[index].isspace(): index += 1
        if index >= len(text) or text[index] not in separators: raise ParseError('no separator')
        index += 1
        while index < len(text) and text[index] in ' \t': index += 1
        value, index = _value(text, index)
        if key in result: raise ParseError('a key twice')
        result[key] = value


def _value(text, index):
    if index >= len(text): return '', index
    char = text[index]
    if char in '"\'' or text.startswith(GEMMA_QUOTE, index):
        end = _string_end(text, index)
        rest = text[end:].lstrip(' \t')
        if rest and rest[0] not in ',;\n': raise ParseError('text after a string')
        return _decode_string(text[index:end]), end
    if char in '{[':
        end = _balanced_end(text, index)
        group = text[index:end]
        try: return _literal(group), end
        except ParseError:
            if char == '{': return _pairs(group[1:-1], ':='), end
            raise
    # A bare value runs to the next `, key:` (or `, key=`) or the end.
    end, cursor = len(text), index
    while True:
        comma = text.find(',', cursor)
        if comma < 0: break
        if _KEY.match(text, comma + 1): end = comma; break
        cursor = comma + 1
    raw = text[index:end].strip()
    if raw in _LITERALS: return _LITERALS[raw], end
    if _NUMBER.fullmatch(raw): return (float(raw) if any(c in raw for c in '.eE') else int(raw)), end
    return raw, end


def _arguments(value):
    if isinstance(value, str):
        try: value = json.loads(value)
        except ValueError as error: raise ParseError('arguments are not JSON') from error
    if value is None: return {}
    if not isinstance(value, dict): raise ParseError('arguments are not an object')
    return value


def _json_calls(value):
    """Calls from a JSON body: {"name", "arguments"} (or parameters/args/input), {"function": {…}}, lists, tool_calls."""
    if isinstance(value, list):
        calls = [call for item in value for call in _json_calls(item)]
        if not calls: raise ParseError('empty list')
        return calls
    if not isinstance(value, dict): raise ParseError('not a call object')
    if isinstance(value.get('tool_calls'), list) and len(value) == 1: return _json_calls(value['tool_calls'])
    if isinstance(value.get('function'), dict): return _json_calls(value['function'])
    name = value.get('name', value.get('tool', value.get('tool_name')))
    if not isinstance(name, str): raise ParseError('no tool name')
    keys = [key for key in ('arguments', 'parameters', 'args', 'input') if key in value]
    if len(keys) > 1: raise ParseError('two argument fields')
    extra = set(value) - {'name', 'tool', 'tool_name', 'type', 'id', *keys}
    if extra: raise ParseError('unexpected fields')
    return [{'name': name, 'arguments': _arguments(value[keys[0]]) if keys else {}, 'style': 'json'}]


def _one_call(text, index, names):
    """One `name(…)`, `name{…}` or `name: {…}` call at `index`; returns (call, end)."""
    found = _IDENT.match(text, index)
    if not found: raise ParseError('no tool name')
    name, cursor = found.group(), found.end()
    if name not in names: raise ParseError('unknown tool', name)
    while cursor < len(text) and text[cursor] in ' \t': cursor += 1
    if cursor < len(text) and text[cursor] in ':=' and text[cursor + 1:].lstrip().startswith('{'):
        cursor = text.index('{', cursor)
    if cursor >= len(text) or text[cursor] not in '({': raise ParseError('not a call')
    end = _balanced_end(text, cursor)
    inner = text[cursor + 1:end - 1]
    if text[cursor] == '(':
        return {'name': name, 'arguments': _python_arguments(name, inner, names[name]), 'style': 'python'}, end
    if inner.strip().startswith('"') or not inner.strip():
        try:
            value = json.loads('{' + inner + '}')
            return {'name': name, 'arguments': value, 'style': 'brace'}, end
        except ValueError: pass
    return {'name': name, 'arguments': _pairs(inner, ':='), 'style': 'brace'}, end


def _python_arguments(name, inner, schema):
    if not inner.strip(): return {}
    if '"""' in inner or "'''" in inner: return _pairs(inner, '=:')  # triple-quoted file content: kept as written
    try: tree = ast.parse(f'f({inner})', mode='eval').body
    except SyntaxError:
        return _pairs(inner, '=:')  # read(path=app/db.py): bare values
    if not isinstance(tree, ast.Call): raise ParseError('not a call')
    try:
        result = {item.arg: _node_value(item.value) for item in tree.keywords if item.arg}
        positional = [_node_value(item) for item in tree.args]
    except ParseError:
        return _pairs(inner, '=:')
    if len(result) != len(tree.keywords): raise ParseError('**arguments')
    if positional:
        # A positional value is mapped only when it can mean one thing: the tool takes exactly one parameter.
        properties = list((schema.get('properties') or {}).keys())
        if len(positional) != 1 or len(properties) != 1 or properties[0] in result: raise ParseError('positional arguments')
        result[properties[0]] = positional[0]
    return result


def _calls(body, names):
    """Every call in a wrapper's body (JSON, or one or more Python/brace calls); ParseError when anything is left over."""
    text = body.strip()
    if text.startswith('```'):
        inner = _FENCE.fullmatch(text)
        if not inner: raise ParseError('broken fence')
        text = inner.group(2).strip()
    if text.startswith('call:'): text = text[5:].lstrip()
    if not text: raise ParseError('empty call')
    if text[0] in '{[':
        return _json_calls(_literal(text))
    calls, index = [], 0
    while index < len(text):
        if text.startswith('call:', index): index += 5
        call, index = _one_call(text, index, names)
        calls.append(call)
        while index < len(text) and (text[index].isspace() or text[index] in ',;'): index += 1
    return calls


# -- schema ----------------------------------------------------------------------------------------------------------
def _coerce(value, schema, where):
    kinds = schema.get('type')
    kinds = kinds if isinstance(kinds, list) else [kinds] if kinds else []
    if 'enum' in schema and value not in schema['enum']:
        if not (isinstance(value, (int, float)) and str(value) in schema['enum']): raise ParseError(f'{where} is not one of its values')
        value = str(value)
    if not kinds: return value
    fits = {'string': lambda v: isinstance(v, str), 'integer': lambda v: isinstance(v, int) and not isinstance(v, bool),
            'number': lambda v: isinstance(v, (int, float)) and not isinstance(v, bool), 'boolean': lambda v: isinstance(v, bool),
            'array': lambda v: isinstance(v, list), 'object': lambda v: isinstance(v, dict), 'null': lambda v: v is None}
    if any(fits.get(kind, lambda v: False)(value) for kind in kinds): return value
    if len(kinds) != 1: raise ParseError(f'{where} has the wrong type')
    kind = kinds[0]
    # Only coercions that cannot mean anything else.
    if kind == 'string' and isinstance(value, (int, float)) and not isinstance(value, bool): return str(value)
    if isinstance(value, str):
        if kind == 'integer' and re.fullmatch(r'-?\d+', value.strip()): return int(value)
        if kind == 'number' and _NUMBER.fullmatch(value.strip()): return float(value) if any(c in value for c in '.eE') else int(value)
        if kind == 'boolean' and value.strip().lower() in ('true', 'false'): return value.strip().lower() == 'true'
        if kind in ('array', 'object'):
            try: parsed = json.loads(value)
            except ValueError: parsed = None
            if fits[kind](parsed): return parsed
    if kind == 'number' and isinstance(value, int) and not isinstance(value, bool): return value
    raise ParseError(f'{where} has the wrong type')


def validate(name, arguments, schema):
    """The arguments, checked against the tool's JSON schema: no unknown keys, every required key, types coerced only
    when unambiguous. ParseError says what does not fit."""
    if not isinstance(arguments, dict): raise ParseError('arguments are not an object')
    properties = schema.get('properties') if isinstance(schema.get('properties'), dict) else {}
    unknown = [key for key in arguments if key not in properties]
    if properties and unknown: raise ParseError(f'unknown argument {unknown[0]}')
    if not properties and arguments and schema.get('additionalProperties') is False: raise ParseError('the tool takes no arguments')
    missing = [key for key in schema.get('required') or [] if key not in arguments]
    if missing: raise ParseError(f'missing argument {missing[0]}')
    return {key: _coerce(value, properties.get(key) or {}, key) for key, value in arguments.items()}


# -- finding ---------------------------------------------------------------------------------------------------------
def _tag_spans(content):
    """(start, end, tag, body) for every tool wrapper; an unclosed last one runs to the end."""
    spans, index = [], 0
    while True:
        found = _OPEN.search(content, index)
        if not found: return spans
        tag = found.group(1)
        close = re.compile(r'<\|?/' + tag + r'\|?>|<' + tag + r'\|>')
        ended = close.search(content, found.end())
        if ended: spans.append((found.start(), ended.end(), tag, content[found.end():ended.start()])); index = ended.end()
        else: spans.append((found.start(), len(content), tag, content[found.end():])); return spans


def _fences(content):
    """(start, end, language) of each fenced block, opening and closing fences paired in order; an unclosed one runs
    to the end (end is None)."""
    blocks, opening = [], None
    for found in re.finditer(r'(?m)^[ \t]*```([\w-]*)', content):
        if opening is None: opening = (found.start(), found.group(1).lower())
        else: blocks.append((opening[0], found.end(), opening[1])); opening = None
    if opening: blocks.append((opening[0], None, opening[1]))
    return blocks


def _lines(content):
    """(offset, line) for every line, in one pass."""
    offset = 0
    for line in content.split('\n'):
        yield offset, line
        offset += len(line) + 1


def _clean(content, spans):
    pieces, index = [], 0
    for start, end in sorted(spans):
        pieces.append(content[index:start]); index = end
    pieces.append(content[index:])
    text = ''.join(pieces)
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def _check(calls, names, wrapper):
    styles = sorted({call.pop('style', 'json') for call in calls})
    pattern = f"{wrapper}/{'+'.join(styles)}"
    for call in calls:
        if call['name'] not in names: return None, Failure('unknown tool', pattern, call['name'])
        try: call['arguments'] = validate(call['name'], call['arguments'], names[call['name']])
        except ParseError as error: return None, Failure(f'invalid arguments: {error}', pattern, call['name'])
    return pattern, None


def _starts_call(text, names):
    """Does this line begin with a call of an offered tool (`name(`, `name{`, `call:name{`, or a backtick before it)?"""
    stripped = text.lstrip(' \t`')
    if stripped.startswith('call:'): stripped = stripped[5:].lstrip()
    found = _IDENT.match(stripped)
    return bool(found and found.group() in names and re.match(r'[ \t]*(?:[:=][ \t]*)?[({]', stripped[found.end():]))


def repair(content, tools):
    """A Repair, a Failure, or None when the content holds nothing that looks like a call of an offered tool."""
    names = offered(tools)
    if not names or not isinstance(content, str) or not content.strip(): return None
    calls, spans, patterns = [], [], []
    # 1. Tool wrappers, anywhere but inside a code block or `inline code` (an example of the format, not a call).
    fenced = [(start, end if end is not None else len(content)) for start, end, _ in _fences(content)]
    for start, end, tag, body in _tag_spans(content):
        if any(begin <= start < stop for begin, stop in fenced) or content[start - 1:start] == '`': continue
        try: found = _calls(body, names)
        except ParseError as error:
            tool = error.args[1] if len(error.args) > 1 else None
            return Failure('unknown tool' if tool else f'unreadable call: {error.args[0]}', f'{tag}-tag', tool)
        pattern, failure = _check(found, names, f'{tag}-tag')
        if failure: return failure
        calls += found; spans.append((start, end)); patterns.append(pattern)
    # 2. Fences: tool fences anywhere; json/python/plain fences only when they end the answer.
    trailing_end = len(content.rstrip())
    for fence in _FENCE.finditer(content):
        if any(start <= fence.start() < end for start, end in spans): continue
        language = fence.group(1).lower()
        if language not in TOOL_FENCES and not (language in END_FENCES and fence.end() == trailing_end): continue
        body = fence.group(2).strip()
        looks = language in TOOL_FENCES or (body[:1] in ('{', '[') and '"name"' in body) or _starts_call(body, names)
        if not looks: continue
        try: found = _calls(body, names)
        except ParseError as error:
            if language in TOOL_FENCES or (len(error.args) > 1): return Failure(f'unreadable call: {error.args[0]}', f'fence-{language or "plain"}', error.args[1] if len(error.args) > 1 else None)
            continue  # a code sample, not a call
        pattern, failure = _check(found, names, f'fence-{language or "plain"}')
        if failure: return failure
        calls += found; spans.append((fence.start(), fence.end())); patterns.append(pattern)
    # 3. A bare call on its own last line(s).
    if not spans or max(end for _, end in spans) < trailing_end:
        tail_from = max([end for _, end in spans], default=0)
        fenced = [(start, end if end is not None else len(content)) for start, end, _ in _fences(content)]
        starts = [begin for begin, line in _lines(content) if begin >= tail_from and not any(start <= begin < end for start, end in fenced) and _starts_call(line, names)]
        for start in starts:
            body = content[start:trailing_end].strip().strip('`').strip()
            try: _one_call(body[5:].lstrip() if body.startswith('call:') else body, 0, names)
            except ParseError as error:  # the call itself cannot be read: worth a log line when it ends the answer
                if start == starts[-1]: return Failure(f'unreadable call: {error.args[0]}', 'bare', error.args[1] if len(error.args) > 1 else None)
                continue
            try: found = _calls(body, names)
            except ParseError: continue  # prose follows: the line only mentions the tool
            pattern, failure = _check(found, names, 'bare')
            if failure: return failure
            calls += found; spans.append((start, len(content))); patterns.append(pattern)
            break
    if not calls: return None
    return Repair(calls, _clean(content, spans), sorted(spans), ','.join(dict.fromkeys(patterns)))


def hold_from(content, tools):
    """Streaming: the earliest index from which the text could still turn out to be a pseudo call (len(content) when
    none). Everything before it can be shown at once; a superset of what `repair` may remove."""
    names = offered(tools)
    if not names: return len(content)
    candidates = [len(content), len(content.rstrip())]  # trailing blank lines wait: they may sit before a call
    for found in re.finditer(r'<', content):  # a wrapper, or the beginning of one
        rest = content[found.start() + 1:found.start() + 24].lstrip('|')
        if any(rest.startswith(tag) or (len(rest) < len(tag) + 1 and (tag + '>').startswith(rest)) for tag in TAGS) or rest == '':
            candidates.append(found.start()); break
    for start, end, language in _fences(content):
        partial = end is None and '\n' not in content[start:]  # the language may still be arriving
        if language in TOOL_FENCES or language in END_FENCES or (partial and any(name.startswith(language) for name in TOOL_FENCES + END_FENCES)):
            candidates.append(start); break
    if content.endswith('`') and not any(end == len(content) for _, end, _ in _fences(content)): candidates.append(len(content.rstrip('`')))
    for start, line in _lines(content):
        last = start + len(line) == len(content)
        stripped = line.lstrip(' \t`')
        if _starts_call(line, names): candidates.append(start); break
        if last and stripped and any(name.startswith(stripped) or 'call:'.startswith(stripped) or stripped.startswith('call:') or
                                     (stripped.startswith(name) and not stripped[len(name):].strip(' \t:=')) for name in names):
            candidates.append(start); break
    hold = min(candidates)
    return len(content[:hold].rstrip())  # the blank space before a held call waits with it
