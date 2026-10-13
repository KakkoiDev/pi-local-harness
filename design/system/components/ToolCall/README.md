# ToolCall

A command Pi ran, shown inside its message with Laya's verdicts underneath.

- `.pw-tool` with the command in `.pw-tool__cmd` (mono, `$ ` prefix) and a checks row (`.pw-tool__checks`): the gate glyph (Laya approved / blocked) and the audit glyph (Verified · exit 0 / Running · 0:12), plus a Show in Laya link.
- `.pw-tool--live` (2px border) while the command runs.
- A blocked command shows Blocked with Laya's reason as one line under the command.
