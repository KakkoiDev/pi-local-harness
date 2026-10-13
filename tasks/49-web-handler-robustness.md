# 49: Web handler robustness

Audit 2026-10-13: the web server caught only ValueError/KeyError/FileNotFound/FileExists,
so a wrongly typed JSON field (for example a numeric `path`) dropped the connection
with no response. One corrupt `conversation.json` made `/api/workspace` return 404 and
hid every project; each poll also re-read every chat once per project. WebP uploads
were accepted on a bare `RIFF` prefix (a WAV passed). Audio uploads were written twice.

- [x] Red: typed-field errors return JSON errors; a corrupt chat leaves the workspace visible; WAV-as-WebP is rejected.
- [x] Catch malformed fields as 400 and unexpected errors as 500; skip unreadable chats; check `WEBP`.
- [x] List chat summaries once per workspace request and match projects from the summaries.
- [x] Green: Python suite passes; update roadmap.
