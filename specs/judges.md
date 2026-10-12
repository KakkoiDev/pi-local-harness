# System Policies (Judges)

## Tool Definitions & Risk Categories

| Tool Name | Risk Category | Description |
| :--- -> | :--- -> | :--- -> |
| `read_file` | `read_only` | Reading content from files. |
| `write_file` | `reversible_write` | Overwriting or creating files. |
| `execute_command` | `high_risk` | Running shell commands. |
| `get_news` | `read_only` | Fetching external news. |

## Authorization Policies

- **READ_ONLY**: Any tool in the `read_only` category is globally allowed.
- **REVERSIBLE_WRITE**: Requires 'standard' authorization.
- **HIGH_RISK**: Requires explicit 'admin' or 'advanced' escalation for tool like `execute_command`.

