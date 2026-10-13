# Alert

A modal alert with a 36px icon: **Stop** (something cannot be done, or is destructive), **Caution** (something needs a decision), **Note** (information).

- Message first in chrome type, then one sentence of detail in the text face saying what is safe.
- The default button is always the safe one: Download Draft… for a save conflict, Cancel for Move to Trash, Reconnect for a lost connection.
- Replaces every `window.confirm()` and `window.prompt()` in the current code.
