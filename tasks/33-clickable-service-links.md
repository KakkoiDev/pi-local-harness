# 33: Clickable service links in Pi

- [x] Add a regression asserting OSC 8 links in the actual startup widget.
- [x] Link the printed Laya and Web URLs while preserving plain status text.
- [x] Verify lifecycle/startup tests, document terminal support, and commit.

The regression was red for plain URLs; it now verifies links for actual dynamically assigned ports and unchanged loop status.
