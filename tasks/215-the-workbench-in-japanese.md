# 215: The workbench in Japanese: Settings → Language

Kind: code

Plan 198 ("a Japanese UI", decided 2026-10-15). The person: "let's build it then."

- [x] `js/i18n.mjs`: English is the source and the key (gettext's way): every piece of interface text, label,
  placeholder and tooltip with a translation is swapped, including text added later (a MutationObserver); patterns
  for text with parts that change; count parts match only numbers, so a pattern never rewrites a sentence Pi wrote;
  what the person or Pi wrote is never translated (messages, documents, names, code, comments, requests, the app in
  the Preview); switching back to English restores the original text without a reload.
- [x] `messages/ja.json`: 657 exact strings and 208 patterns, Mac Japanese conventions (ファイル, 編集, ウインドウ, 取り消す…),
  the designer's Japanese from P_Japanese and the DoneRow card as given. Written by a helper agent from the strings
  extracted from index.html, js/*.mjs and the server's messages; its review found user content outside the skip list,
  now skipped, and the DoneRow's own sentences (Undid …, Pi did not try it …) marked as interface text.
- [x] Settings → Language: English · 日本語 · Match System (each language by its own name). Someone who used the
  workbench before keeps English until they choose; a new install follows the Mac. The Preview's app language starts
  in the workbench's language.
- [x] Tests (node, `tests/harness/i18n.test.mjs`: exact and pattern translation, numbers-only counts, the choice, the
  file's patterns keep their parts; browser, design.cjs: Japanese menus, tabs and placeholder, then English back).
  Checked in the browser at 1440 and at phone width: Chat, Work, Activity, Gate, the menus and Settings have no English
  left but names; Japanese labels wrap.
- [ ] Terminal Pi stays in English.
- [ ] The designer has not drawn the Language group in Settings (it reuses Appearance's layout and the new Radio).
