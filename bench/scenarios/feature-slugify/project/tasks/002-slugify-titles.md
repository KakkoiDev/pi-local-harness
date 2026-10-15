# 002: Slugify titles

Kind: code

Add `slugify(title)` to text.py: it returns the title for a URL.

- [ ] Lowercase; accented letters lose their accent ("Café" → "cafe")
- [ ] Anything that is not a letter or a digit becomes one "-" (runs collapse: "a  &  b" → "a-b")
- [ ] No "-" at the start or the end; an empty result is "untitled"
- [ ] Tests for each rule
