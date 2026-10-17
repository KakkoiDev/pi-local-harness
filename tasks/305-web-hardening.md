# 305: The workbench cannot be framed or sniffed

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Items 12, 26.

- [ ] `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` on every page and API reply; `X-Content-Type-Options:
  nosniff` on JSON; 500 replies never echo exception text.
- [ ] Test: the headers on /, /p/x/chat and /api/config.
