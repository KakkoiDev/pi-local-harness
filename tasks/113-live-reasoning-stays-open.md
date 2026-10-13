# 113: An open Reasoning panel stays open while Pi thinks

Kind: code

Request 2026-10-13: "in the chat, the thinking pane closes when the agent adds new line to the thinking." Cause: `renderMessages` (js/chat.mjs) rebuilds the live reply on every update and restores the open state only for finished messages.

- [x] Red (tests/browser/design.cjs, fake Pi `TEST_THINK` streams reasoning for a few seconds): open the live Reasoning panel; it stays open while new reasoning arrives, and stays open on the finished message.
- [x] Keep the live reply's `<details>` open state across re-renders.
- The live reply is marked `data-live`; its panel state carries across re-renders and onto the finished reply. Red/green: tests/browser/design.cjs § 113 (fake Pi `TEST_THINK`).
