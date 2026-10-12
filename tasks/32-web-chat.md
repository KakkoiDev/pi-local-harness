# 32: Mobile multimodal Pi chat

Replace the portfolio landing page with a chat interface. Persist and manage several
conversations in a left sidebar. Accept text, images, audio, and text-file attachments.
Use Pi sessions with the same Laya guard and watchdog, sharing existing services.

- [x] Add regression tests and confirm missing backend/storage behavior is red.
- [x] Implement conversation storage, uploads, Pi RPC bridge, and responsive UI.
- [x] Verify backend and browser flows; update architecture docs and commit.

Validation: storage/attachment/RPC tests (5), HTTP integration, real Pi startup, desktop/mobile Chromium flows, and real Gemma text and media requests. Regression tests use a clearly labeled RPC fixture for deterministic browser checks; live inference is checked separately.
