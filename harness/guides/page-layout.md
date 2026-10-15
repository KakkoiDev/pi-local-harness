---
triggers: the page, this page, a page, web page, layout, scroll, scrolls, view, screen, white, lifted, lifts, jumps, gap, css, width, px, phone, mobile, overlap, hidden
---
A page problem: observe it before reading code. Use the browser tool at the size the problem needs (a phone is 390,
a tablet 1024), do the steps that cause it, and probe "scrolled", "scrollable" and "positioned". Read what moved and
what it is placed against, then read the CSS of exactly those elements. Common causes: an absolutely positioned
element placed against an unexpected ancestor (the nearest one with position other than static), a parent with
overflow that makes it scrollable, scrollIntoView scrolling every scrollable ancestor. Check the fix with the same probe.
