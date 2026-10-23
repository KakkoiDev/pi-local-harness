# 63: Node version check at launch

Kind: code

Pi 0.87.1 crashes on Node 20. plh must stop with a clear message instead.

- [x] Red: plh exits with "Pi needs Node >= 22.19.0" (Pi 0.87.1 package.json engines) when the `node` on PATH is older.
- [x] Green: full suite.

## Scenarios

### US-359 terminal: plh with an old Node stops and says Pi needs Node 22.19.0 or newer
Given the node on PATH is version 20
When I start plh
Then it stops at once with “Pi needs Node >= 22.19.0”
And Pi is not started

## Verification

The current Pi 1.1.0 package still declares Node >= 22.19.0. The real launcher regression first failed because Pi started with a fake Node 20. The launcher now checks the stable version before starting Pi, with a five-second limit; setup and already-running notices remain usable. Boundary, malformed, missing, failed and timed-out version checks are covered. Full Python/Node workflow and all browser suites passed, including the 15-step golden journey.
