# ContextLine

One line that says which files Pi gets with a request, before you send it (**Pi sees:**), and which files Pi opened itself while answering (**Also read:**).

- Where: under the Chat composer row; under the comment composer (Review window, phone comment sheet) and under an unsent thread's actions; under the “Ask Pi about this whole file” box. **Also read** sits at the end of Pi's message in Chat and of Pi's answer in a comment thread or whole-file answer (`.pw-context--after`, dotted rule above).
- Content, in the harness's order: the roadmap `ROADMAP.md (plan)`, the open tasks as one item (“11 open tasks”), the current document `DESIGN.md (this file)`, files the request mentions, related files `(related)`. File names only: the full path is the link's `title`.
- Each file name is a link that opens the file in Work (a new tab on ⌘-click). “11 open tasks” is text.
- One line, always: items that do not fit are hidden and counted in `.pw-context__more` (“+2”). Pressing it sets `aria-expanded="true"` and `data-expanded` on the line, which wraps to show every item; it then reads “Less”. At 380px the line keeps the label, two names and the counter.
- It updates as you type (debounced 300 ms) from the same function the harness uses, so it never promises a file Pi will not get. Empty context: “Pi sees: nothing from this project”.
- Markup: `<p class="pw-context" id="chat-context"><span class="pw-context__label">Pi sees:</span><span class="pw-context__list" role="list"><span class="pw-context__item" role="listitem"><a href>ROADMAP.md</a><span class="pw-context__kind">(plan)</span></span>…</span><button class="pw-context__more" aria-expanded="false" aria-label="Show 2 more">+2</button></p>`.
