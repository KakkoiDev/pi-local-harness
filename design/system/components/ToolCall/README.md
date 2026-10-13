# ToolCall

A command Pi ran, shown inside its message with Gate's verdicts underneath.

- `.pw-tool` with the command in `.pw-tool__cmd` (mono, `$ ` prefix) and a checks row (`.pw-tool__checks`): the gate glyph (Gate approved / blocked) and the audit glyph (Verified · exit 0 / Running · 0:12), plus a Show in Gate link.
- `.pw-tool--live` (2px border) while the command runs.
- A blocked command shows Blocked with Gate's reason as one line under the command (`.pw-tool__reason`).
- Built by `toolCard(tool)` in `js/ui.mjs` from a job's `tools[]` (id, name, detail, status, checks). Used for the live card in Chat and the Commands list in the Activity detail. A tool with no Gate event shows "No Gate record".
