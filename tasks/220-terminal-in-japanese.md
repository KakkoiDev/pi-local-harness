# 220: Terminal Pi in Japanese; /commands stay English

Kind: code

The person, 2026-10-15: "For the CLI of the pi harness, only the UI and the texts will be translated, the / commands
will be kept in English."

- [x] `harness/language.mjs`: the setting `language` (system: the terminal's locale; en; ja), the same dictionary as
  the web (messages/ja.json, English as the key); `translateView` translates a console view's titles, labels, headers,
  state words and prose, never values (names, paths, ids) and never a /command. Only the screen is translated: Pi reads
  the English.
- [x] Applied to the console's views, the notices, the tool rows, the footer, the startup lines and the timestamps.
- [x] `harness/terminal-render.mjs` counts columns, not characters: Japanese takes two columns; tables line up and
  Japanese wraps between characters.
- [x] Tests (node, `tests/harness/language.test.mjs`): columns, the language choice, a translated view with its values
  and its /command untouched.
- [ ] The terminal's Japanese strings (a helper agent is writing them into messages/ja.json).
