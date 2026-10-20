# 346: Record Capacitor exports for mobile and desktop

Kind: docs
No scenarios: records the owner's architecture decision and future acceptance criteria; no runtime or UI change.

- [x] Red: manual acceptance failed because plan253 had no unified mobile/desktop decision.
- [x] Record official Capacitor mobile targets and the Electron integration for Windows/macOS/Linux, preserving server/browser exports.
- [x] Record native local-file/storage requirements, isolated bridge, cross-target tests, downloads/signing and design requirements.
- [x] Add the desktop implementation task and extend task281's coverage; verify the documentation links and workflow before commit.

## For the person

The plan now includes native Windows, macOS and Linux exports alongside Android/iPhone from the same app source.
Tried it: checked the decision, task links and cross-platform acceptance criteria. Implementation and real platform builds remain open in tasks275–281 and347.
