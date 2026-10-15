# PreviewWindow

The project's own app, live, beside the chat (plan 198). For the person who judges the app, not the diff. Boards: the canvas's App preview page, P_Beside … P_Japanese, Ph_Preview.

- **Where**: its own window to the right of the chat (`section.pw-window.pw-preview#preview`), 480px wide by default, while the chat keeps at least 480px. Below that it becomes a third segment of the view control: Chat ⌘1 · Work ⌘2 · Preview ⌥⌘P (⌘3 and ⌘4 are Activity and Gate). It also sits beside Work.
- **Opening**: the chat info bar's **Preview** toggle (`aria-pressed`, `aria-controls="preview"`) and Window → Preview ⌥⌘P are one command. The first time a project has an app, the Preview opens by itself once; after that it opens as the person left it.
- **Toolbar 1**: `.pw-address`: the app's name (dim) and an editable path (`/`, `/notes`), Return loads it; **Reload**.
- **Toolbar 2**: two SegmentedControls: size **Phone** (390 wide) · **Tablet** (768 × 1024, scaled to fit, the caption says the scale) · **Full** (the window's width; zoom the window for more); the app's language **English · 日本語** (the app's, not the workbench's).
- **Note line** `.pw-preview__note` (role="status"): only after a reload caused by a change: “✓ Pi changed 2 files. Reloaded.” / “↶ Undo changed 2 files. Reloaded.” with the time. The app reloads itself (`--reload`); the line only says so.
- **Stage** `.pw-preview__stage.pw-desk`: the app in `.pw-preview__frame` (an iframe; 1px frame, 2px hard shadow), caption under it. The app keeps its own look: it is the person's, not System 1.
- **Foot** `.pw-preview__foot`: the state as glyph + word, one **Stop** / **Start** button, then **Open on Phone…** (the Phone dialog's QR, for the app's address) and **Open in Browser**, disabled until it runs.
- **States** (the harness's four, task 202: none · starting · running · stopped): ▶ Running · ◷ Starting… (“The first start installs what the app needs: about 15 seconds. After that it starts in a moment.”, the last uv line dim) · ○ No app (“This project has no app to show yet.” + an example request; for a project that is not an app, say what it is and dim the window with `.pw-preview--dim`, never hide it) · ⬣ Stopped (“The app stopped because of an error.”, the app's last 8 lines in mono with the last one bold, **Ask Pi to Fix** default, **Start Again**). After Ask Pi to Fix: “Pi is fixing this. The app starts again by itself when Pi finishes.”
- **Lifetime**: starts when the Preview is shown, stops when the project is closed or plh quits. Not started before it is opened.
- Every bar wraps; no label has a fixed width (Japanese labels: 再読み込み, スマホ · タブレット · 全幅, スマホで開く…, ブラウザで開く, 停止 / 起動).
- **Phone**: a view in the view menu (Chat · Work · Preview, with the app's state as key text), not a sheet. Address + Reload, the note line, the app full width with no frame, foot: state, EN · 日本語, **Open App** (Safari; Add to Home Screen installs it).
