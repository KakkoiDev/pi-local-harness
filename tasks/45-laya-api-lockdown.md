# 45: Lock the Laya API to the local harness

Audit 2026-10-13: Laya sent `Access-Control-Allow-Origin: *` and checked no Host,
Origin, or credential. `/gatekeep` with an `edit` proposal answered `ALLOW` only when
a guessed `oldText` occurred once in any readable file, so any web page could read
files byte by byte. Reproduced with a forged `Origin: https://evil.example`.

- [x] Red: services test requires a token, rejects foreign Origin/Host/missing token, and expects no CORS headers.
- [x] Red: web-started Pi receives the token (`PI_HARNESS_TOKEN`).
- [x] Remove CORS, require loopback Host, reject any Origin, require the per-run token.
- [x] Green: services, web chat, legacy API, and Node extension tests pass; exploit now returns 403.
- [x] Update README security note and roadmap.
