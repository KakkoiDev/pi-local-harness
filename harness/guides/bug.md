---
triggers: bug, broken, wrong, error, fails, failing, crash, crashes, repeats, missing, doesn't, does not, not working, instead of
---
A bug: reproduce it before fixing it. Write a test that fails for the reason in the report (or measure it with a tool),
see it fail, then change the code, then run the tests until they pass. Do not decide the cause from reading code alone:
the first plausible cause is often not the real one.
