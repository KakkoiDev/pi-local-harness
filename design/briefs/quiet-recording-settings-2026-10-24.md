# Designer follow-up: quiet structural recording in Settings

The owner now requests default-on recording with no always-visible setting or status bar. This supersedes round 15/19’s permanent recording controls and WorkStation opt-in presentation. Do not ask again whether the controls should stay on the main screen.

Task 366 uses existing Settings fieldsets, checkbox, help text and recording panels as the smallest implementation. Reconcile the canvas/components/spec with it: global “Allow action recording”, followed by detailed WorkStation/Preview controls in Settings. Off stops capture across both surfaces/windows/new projects and preserves history. Turning it back on explicitly enables both; previous per-surface opt-outs remain on upgrade until the person changes them. Never record typed contents. Explain structural capture, shared-profile access, host-only storage, 7 days/20 flows and less interaction context/reproducibility when disabled. Automatic inclusion in AI context is still pending, so do not claim it already happens.

Draw phone 320/390 and desktop 1024/1440, dark/light, English/Japanese, long text, keyboard/focus, saved/off/error states, full/truncated flow and advanced per-surface exceptions. Panels must remain operable within the native Settings dialog and restore focus when closed. No persistent banner or badge outside Settings. Keep stop/history retention and cross-window security decisions.

Update earlier conflicting copy, boards, component previews, IMPLEMENTATION.md and acceptance journeys. Commit/push only your design files on a design branch and report any publication failure honestly.
