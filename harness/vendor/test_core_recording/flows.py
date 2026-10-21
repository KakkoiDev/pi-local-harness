"""Dependency-free, privacy-first Recorder flow boundary and replay skeletons.

Only structural CSS selectors are accepted by default. Human labels, IDs, data
attributes, raw input, arbitrary metadata and application error messages are not
retained. These are intentionally lossy debugging traces, not exact replays.
"""
import ipaddress
import json
import math
import re
from urllib.parse import urlsplit

_SELECTOR = re.compile(r'[a-z][a-z0-9-]*(?::nth-of-type\([1-9][0-9]{0,4}\))?(?: > [a-z][a-z0-9-]*(?::nth-of-type\([1-9][0-9]{0,4}\))?){0,11}')
_KEYS = {'Enter', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'}


def _number(value, default=0):
    return value if type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 100000 else default


def _origin(value):
    try:
        url = urlsplit(value)
        host = url.hostname
        if url.scheme not in ('http', 'https') or not host:
            return None
        if host != 'localhost' and not ipaddress.ip_address(host).is_loopback:
            return None
        port = url.port
        host = '[' + host + ']' if ':' in host else host
        return f'{url.scheme}://{host}' + (f':{port}' if port else '') + '/'
    except (ValueError, TypeError):
        return None


def clean_flow(flow, *, max_steps=500):
    """Normalize untrusted Recorder JSON. Unknown steps are dropped, malformed input refused.

    Routes can themselves contain personal text or credentials, so navigation is
    reduced to its loopback origin. Hosts should map routes explicitly in a
    reviewed adapter rather than copying arbitrary paths into reports.
    """
    if not isinstance(flow, dict) or not isinstance(flow.get('steps'), list):
        raise ValueError('A recording needs a steps array.')
    if type(max_steps) is not int or not 1 <= max_steps <= 5000:
        raise ValueError('Choose a step limit from 1 to 5000.')
    steps = []
    for raw in flow['steps'][:max_steps]:
        if not isinstance(raw, dict):
            raise ValueError('Each recorded step must be an object.')
        kind = raw.get('type')
        step = {'type': kind}
        if kind in ('click', 'doubleClick', 'hover', 'change', 'waitForElement', 'focus', 'blur'):
            supplied = raw.get('selectors', [])
            if not isinstance(supplied, list):
                continue
            selectors = []
            for selector in supplied[:6]:
                if isinstance(selector, list) and len(selector) == 1 and isinstance(selector[0], str) and len(selector[0]) <= 600 and _SELECTOR.fullmatch(selector[0]):
                    selectors.append(list(selector))
            if not selectors:
                continue
            step['selectors'] = selectors
            if kind in ('click', 'doubleClick'):
                step.update(offsetX=_number(raw.get('offsetX')), offsetY=_number(raw.get('offsetY')))
            if kind == 'change':
                value = raw.get('value')
                length = len(value) if isinstance(value, str) else value.get('length', 0) if isinstance(value, dict) else 0
                step['value'] = {'redacted': True, 'length': int(_number(length))}
        elif kind == 'navigate':
            origin = _origin(raw.get('url'))
            if not origin:
                continue
            step['url'] = origin
        elif kind in ('keyDown', 'keyUp'):
            if not isinstance(raw.get('key'), str) or raw['key'] not in _KEYS:
                continue
            step['key'] = raw['key']
        elif kind == 'setViewport':
            step.update(width=max(1, int(_number(raw.get('width'), 800))), height=max(1, int(_number(raw.get('height'), 600))))
        elif kind == 'scroll':
            step.update(x=_number(raw.get('x')), y=_number(raw.get('y')))
        else:
            continue
        steps.append(step)
    return {'title': 'Recorded flow', 'steps': steps}


def convert(flow, *, target='python'):
    """Produce a deliberately failing test skeleton; never infer the expected outcome.

    The caller supplies page/base fixtures (Python) or installs @playwright/test
    (JavaScript). No downloads or execution are performed by this function.
    """
    if target not in ('python', 'javascript'):
        raise ValueError('Choose python or javascript.')
    flow = clean_flow(flow)
    py = target == 'python'
    lines = ['def test_recorded_flow(page, base):'] if py else ["import { test } from '@playwright/test';", "test('Recorded flow', async ({ page, baseURL }) => {"]
    indent = '    ' if py else '  '
    quote = lambda text: json.dumps(text, ensure_ascii=True)
    for step in flow['steps']:
        kind = step['type']
        locator = f'page.locator({quote(step["selectors"][0][0])})' if 'selectors' in step else ''
        if kind == 'navigate':
            code = 'page.goto(base)' if py else 'await page.goto(baseURL);'
        elif kind in ('click', 'doubleClick', 'hover', 'waitForElement', 'focus', 'blur'):
            action = {'click': 'click', 'doubleClick': 'dblclick', 'hover': 'hover', 'focus': 'focus', 'blur': 'blur', 'waitForElement': 'wait_for' if py else 'waitFor'}[kind]
            code = f'{locator}.{action}()' if py else f'await {locator}.{action}();'
        elif kind == 'change':
            code = ('#' if py else '//') + ' Supply a synthetic value for the redacted input; never paste private text.'
        elif kind == 'setViewport':
            size = json.dumps({key: step[key] for key in ('width', 'height')})
            code = f'page.set_viewport_size({size})' if py else f'await page.setViewportSize({size});'
        elif kind in ('keyDown', 'keyUp'):
            action = 'down' if kind == 'keyDown' else 'up'
            code = f'page.keyboard.{action}({quote(step["key"])})' if py else f'await page.keyboard.{action}({quote(step["key"])});'
        else:
            code = ('#' if py else '//') + ' Recorded scroll: add an explicit visible-state check if relevant.'
        lines.append(indent + code)
    lines.append(indent + ('assert False, "Add the expected outcome before this test can pass."' if py else 'throw new Error("Add the expected outcome before this test can pass.");'))
    if not py:
        lines.append('});')
    return '\n'.join(lines) + '\n'
