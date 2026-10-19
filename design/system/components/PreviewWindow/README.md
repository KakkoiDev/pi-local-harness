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

## Round 15: the address, two ports, more windows (task 321)

Boards: R15_PreviewAddress, R15_PreviewUsers, R15_PreviewBlocked, R15_PreviewAddress1024, R15_PreviewStates, R15_PreviewNarrow, R15_PreviewStrings, Ph15_PreviewAddress, Ph15_PreviewAddressSheet, Ph15_PreviewStopped. CSS: round15_b.css (`.pw-address__host--addr`, `.pw-addrbtn`, `.pw-addr`, `.pw-reason`, `.pw-preview__note--alert`).

### Anatomy (changes only)

- **Toolbar 1**: the host part of `.pw-address` is now the **usable address**, mono (`.pw-address__host--addr`): `127.0.0.1:7801` on this Mac, the tailnet host from another device, `—` with no app. Then the editable path, **Reload**, and **Address** (`button.pw-addrbtn#preview-addr-about`, accessible name “About this address”, `aria-haspopup="dialog" aria-expanded aria-controls="preview-addr"`). A recording indicator from part A (`RecordingStatus`) sits in this toolbar too, before Address; its spec is in its own card.
- **Address popover** `div.pw-addr#preview-addr role="dialog"` “Where Class Notes runs”, three sections:
  1. **On this Mac**: one address to use, `http://127.0.0.1:7801/notes` (the current path and `?lang=` of the App language), **Copy Address**. When the app server's port differs from the Preview's, one sentence: “Use this address. The app itself listens on port 8000; the Preview passes it through port 7801, which stays the same when the app restarts and lets the phone reach it safely.” When they are the same, no sentence and one number. Opened from another device on the tailnet the section reads **From this device, over Tailscale** with the tailnet address and its own sentence; no 127.0.0.1 appears.
  2. **On your phone**: Tailscale explanation and **Open on Phone…** (the existing guarded phone route, unchanged). Tailscale off: “Not available” dotted, with the reason.
  3. **Two people at once**: windows share sign-in and saved data; a second user needs a private window (the browsers' own keys, named not pressed: ⇧⌘N, Firefox ⇧⌘P) or another browser profile. Never claims a separate account; the workbench never tries to open a private window.
- **Foot**: **Open in Browser** becomes **Open in New Window** (`#preview-newwin`, accessible name “Open Class Notes in a new browser window”). Each press opens another window at the Preview's current path and App language (`?lang=en|ja`) with `window.open(url, '_blank', 'noopener')`; the app keeps running, nothing restarts. After it: the note line “Opened /notes in a new window, in English.” and, beside the button, “{n} open” (windows this tab opened, while they are open). The first time per project a dotted Workbench notice repeats the two-people sentence with **Copy Address**.
- **Window menu**: after Preview ⌃⌥V, a separator, **Open App in New Window ⌃⌥B** and **Copy App Address**; disabled with the same reason as the button. No ⌘ key: ⌘N, ⌘T, ⇧⌘N belong to the browser.

### States

| State | Address host | Reload | Open on Phone… · Open in New Window | Reason (`.pw-reason`, `aria-describedby`) |
| --- | --- | --- | --- | --- |
| Running | 127.0.0.1:7801 | on | on | — |
| Starting… | 127.0.0.1:7801 | off | off | Opens when the app is running. |
| Stopped by an error (incl. a missing package) | 127.0.0.1:7801 | off | off | The app stopped. Start it, then open a window. |
| Stopped by you | 127.0.0.1:7801 | off | off | The app is stopped. Start it first: a window never starts it. |
| No app | — | off | off | There is no app yet. |
| Terminal app (round 9) | “Runs python -m quiz” | Restart | on | Each window starts its own run of the quiz; this one keeps going. |
| Popup blocked | — | — | — | an alert note line (`.pw-preview__note--alert`, role="alert"): “The browser blocked the new window. Open it with this link:” a real `<a target="_blank" rel="noopener">` “Open /notes in a new window ↗” (a click is never blocked) and **Copy Address**, then “To skip this next time, allow pop-ups for 127.0.0.1:7777 (this workbench) in the browser’s settings.” |

Disabled controls stay visible. Nothing queues a window for later, and no window starts or restarts the app.

### Keyboard, focus, announcements

- Tab order in toolbar 1: path → Reload → Address. Address opens the popover with focus on Copy Address; Tab cycles inside; Esc closes and returns focus to Address. Copy Address announces “Address copied” (role="status").
- Open in New Window: focus stays on the button (the new window takes the browser's focus); the note line is role="status". Blocked: the alert line is announced and focus moves to its link.

### Phone

- The Preview view's address host is the tailnet host (`your-mac…:8443`, ellipsed; the full address in the sheet); **Address** (44 px) opens a sheet “Where Class Notes runs”: the phone's own address, Copy Address, Open App, the Private tab sentence, and “The Mac’s own 127.0.0.1 address is not shown: it doesn’t work on a phone.” **Open App** (accessible name “Open Class Notes in Safari”) opens Safari again each time at the current path and language. Stopped: Open App disabled, the reason in the note line.
- 320 wide (narrow content): the address takes its own row and breaks anywhere; Open on Phone… and Open in New Window take full rows.

### Copy (EN · JA)

See R15_PreviewStrings for the full table. Main: Address · アドレス; About this address · このアドレスについて; Where Class Notes runs · クラスノートの実行場所; Copy Address · アドレスをコピー; Open in New Window · 新しいウインドウで開く; Two people at once · 2 人で同時に試す; Open App in New Window · アプリを新しいウインドウで開く.

### Changed earlier copy

- Foot **Open in Browser** → **Open in New Window** (ブラウザで開く → 新しいウインドウで開く). The terminal app's foot likewise.
- Toolbar 1's dim app name (“Class Notes”) → the address host in mono; the app name stays in the title bar.

### Walkthrough (one Given/When/Then each; names are accessible names)

1. Given Class Notes runs at /notes with App language 日本語, when I press “Open Class Notes in a new browser window” twice, then two windows open at 127.0.0.1:7801/notes?lang=ja, the note reads “Opened /notes in a new window, in 日本語.”, the foot shows “2 open”, and the status stays “Running” with the same start time.
2. Given the app listens on 8000 and the Preview on 7801, when I press “About this address”, then “Where Class Notes runs” shows http://127.0.0.1:7801/notes and why there is a second number, and “Copy Address” copies exactly that.
3. Given two windows opened, when I read the notice, then it names a private window or another profile and claims no separate account.
4. Recovery: given pop-ups are blocked, when I press “Open Class Notes in a new browser window”, then the alert offers the link “Open /notes in a new window ↗” (opens the app) and “Copy Address”.
5. Recovery: given the app is stopped, then “Open Class Notes in a new browser window” is disabled and described by “The app is stopped. Start it first: a window never starts it.”; Start enables it.
6. Given the workbench on a phone over Tailscale, when I open the Address sheet, then the address starts with https://your-mac.your-tailnet.ts.net:8443 and nothing on the sheet contains 127.0.0.1.
7. Given two Workbench tabs on one project, when I reload one and press Open in New Window in the other, then both show the same address; the open count is per tab.

### Don't

- Don't show the app server's port as something to open, or two numbers without the sentence.
- Don't promise a second user, a new identity, or a private window the workbench opens itself.
- Don't offer 127.0.0.1 to a phone or to another device.
- Don't start, restart or reload the app from Open in New Window.

### Open product choices (for the owner)

- Which address is the usable one: drawn as the Preview's port (7801), assuming it stays the same across app restarts and works in an ordinary browser window. If the proxy only works inside the workbench, show the app port instead and drop the sentence.
- Language in a new window: drawn as `?lang=` on the address; the no-server starter reads it, the web starter needs to read it too (it sets the language by a POST today).
- Terminal app: a new window starts another session (textual-serve runs one app process per connection). Alternative: disable it with a reason.
- The “{n} open” count: windows this tab opened and still open (a closed window is noticed through `window.closed`). Drop it if that is unreliable across browsers.
- ⌃⌥B for Open App in New Window; with VoiceOver on, ⌃⌥ keys need VoiceOver's pass-through first.
