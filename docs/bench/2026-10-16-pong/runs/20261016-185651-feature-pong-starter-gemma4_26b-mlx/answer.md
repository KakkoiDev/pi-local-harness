I have initialized the project roadmap and tasks.

# 001: Plan this app

## Goal
Implement a minimal, local-only Pong game with two-player controls (W/S for left, Arrows for right) on a black background with white elements.

## Proposed Plan

### 1. Core Logic (`js/logic/pong.mjs`)
- **Movement**: Update ball position based on velocity.
- **Collisions**:
  - Ball vs. Top/Bottom walls.
  - Ball vs. Paddles.
  - Ball vs. Left/Right walls (ends a point).
- **Paddle Physics**: Update paddle positions based on key presses.

### 2. Game Loop and UI (`js/app.mjs`)
- Use `requestAnimationFrame` for a smooth game loop.
- Use an HTML5 `<canvas>` for rendering.
- Handle input (W, S, ArrowUp, ArrowDown).
- Draw the ball, two paddles, and current scores.

### 3. Cleanup and Setup
- Remove Notes-related files and translations.
- Update `manifest.webmanifest`, `index.html`, and `sw.js` for the Pong app.
- Update README and task lists.

## Deployment/Tech Stack
- Plain JavaScript (ES Modules)
- HTML5 Canvas API
- Tailwind CSS (for any overlay UI)
- Local-only (no server)

Does this plan look good to you? Once you approve, I will start implementation.