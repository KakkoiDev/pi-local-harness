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
- [x] The terminal's Japanese strings: 318 exact entries and 128 patterns in messages/ja.json (admin views, settings,
  notices, footer, startup, tool rows, /verbose, the picker, extension notifications).
- [x] What the review found left out: the dim tool-row lines are translated before dim(); the startup is read in English
  (the phone line and its QR code, the narrow-width shortenings) and drawn translated, counting columns; state cells in
  STATE, DECISION, CAN and RESULT columns, kv values that start with a mark ("✓ Running"), `lines` parts and errors.
- Known limits: "Queue", "From" and "Thinking" share the web's entries (キューに追加, 送信元, 思考中), which read oddly as
  the /queue title, the undo preview's time row and the model preview; GUIDE.md answers, Gate rule names and
  `/models check` lines stay English.
