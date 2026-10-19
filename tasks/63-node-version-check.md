# 63: Node version check at launch

Kind: code

Pi 0.87.1 crashes on Node 20. plh must stop with a clear message instead.

- [ ] Red: plh exits with "Pi needs Node >= 22.19.0" (Pi 0.87.1 package.json engines) when the `node` on PATH is older.
- [ ] Green: full suite.

## Scenarios

### US-new terminal: plh with an old Node stops and says Pi needs Node 22.19.0 or newer
Given the node on PATH is version 20
When I start plh
Then it stops at once with “Pi needs Node >= 22.19.0”
And Pi is not started
