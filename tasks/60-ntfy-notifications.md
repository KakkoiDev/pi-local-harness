# 60: ntfy notifications

Kind: code

Request 2026-10-13: notify the user through ntfy, configurable from the CLI and the web UI.

- [ ] Red: `config.json` accepts `ntfy` (server URL and topic); invalid values stop plh with a clear error.
- [ ] Red: Gate posts to ntfy on Blocked, on reaching check, and when Pi exits unexpectedly; nothing is sent without configuration.
- [ ] Pi CLI: `/ntfy <url>` and `/ntfy off`; web UI: settings field with a test button.
- [ ] Green: full suite.

## Scenarios

### US-new terminal: /ntfy sets where notifications go and /ntfy off stops them
Given terminal Pi in a project with no ntfy setting
When I type /ntfy https://ntfy.sh/my-topic, then /ntfy off
Then each command says what is now set, and Settings in the web shows the same

### US-new Settings: an ntfy address with Send Test sends a test notification
Given Settings is open in the web workbench
When I enter an ntfy address and choose Send Test
Then the page says the test notification was sent

### US-new a blocked task sends me a notification; without ntfy set nothing is sent
Given ntfy is set and Pi is building a task
When the task becomes blocked
Then a notification naming the project and the reason is posted to my topic
