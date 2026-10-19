# Scenarios

What the game does, as a person uses it. Each scenario has one e2e test in `tests/e2e/` named after its title.

## Pong

### Scenario: Switch the game to Japanese and back to English
- Given the game page in English
- When I press 日本語
- Then the controls line is in Japanese
- And pressing English brings it back in English
