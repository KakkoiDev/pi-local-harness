# Message

A turn in the project chat.

- Yours: `.pw-msg.pw-msg--user`, right-aligned, framed with `radius-bubble`. Pi's: `.pw-msg`, unframed, left.
- Label row (`.pw-msg__label`): **You** or **Pi**, then the time. Body (`.pw-msg__body`) keeps line breaks.
- Reasoning: a `<details>` with summary Reasoning, closed by default. Attachments: images framed at most 420px wide, audio with native controls, other files as `.pw-file` links.
- While Pi works, the live message ends with a ToolCall in its `--live` state or a status line (Thinking…, Using bash…).
