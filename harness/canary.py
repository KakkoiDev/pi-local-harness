"""The [CANARY] marker is internal protocol (harness/AGENTS.md, harness/memory.mjs missingCanary): every answer starts
with it so the extension can spot instruction drift. People never see it (the owner, 2026-10-18: "the model outputs
[CANARY] in the responses. we should not show it"). Models also write it in code or bold: `[CANARY]`, **[CANARY]**.

The extension reads the raw message, so drift detection is unaffected; the workbench strips the marker before it saves
or shows an answer (conversation, Activity record, job text, comment replies). js/message-markdown.mjs `spoken` does
the same in the page, for answers saved before this."""
import re

# A leading marker, bare or wrapped in matching backticks, bold or italics, with the whitespace (and one ':') after it.
# The same expression is in js/message-markdown.mjs and harness/memory.mjs.
LEADING = re.compile(r'\A\s*(?:\[CANARY\]|`{1,3}\[CANARY\]`{1,3}|\*\*\[CANARY\]\*\*|\*\[CANARY\]\*|__\[CANARY\]__|_\[CANARY\]_)[ \t]*:?\s*')
FORMS = ('[CANARY]', '`[CANARY]`', '**[CANARY]**', '*[CANARY]*', '__[CANARY]__', '_[CANARY]_')


def strip_canary(text, streaming=False):
    """The answer without a leading [CANARY] marker. While streaming, a text that is still only the start of a marker
    ("[CAN", "`[CANARY") shows as nothing, so the marker never flashes on the screen."""
    if not isinstance(text, str) or not text: return text
    stripped = LEADING.sub('', text, count=1)
    if streaming and stripped == text:
        head = text.lstrip()
        if head and any(form.startswith(head) for form in FORMS): return ''
    return stripped
