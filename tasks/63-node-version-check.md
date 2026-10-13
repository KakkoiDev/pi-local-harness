# 63: Node version check at launch

Kind: code

Pi 0.87.1 crashes on Node 20. plh must stop with a clear message instead.

- [ ] Red: plh exits with "Pi needs Node >= 22.19.0" (Pi 0.87.1 package.json engines) when the `node` on PATH is older.
- [ ] Green: full suite.
