# Plan 221: Installing, starting and updating Pi Workbench, on every computer and phone

Date: 2026-10-15. Status: planned; decisions below.

The person, 2026-10-15: "The build in gh should have installers for Mac/Linux/Windows. And the app should be a PWA as
well to install a 'shortcut' on a mobile device or secondary laptop. The install message should be clear that this will
not run the backend on the device. And the install prompt should appear only on devices that are not the main server
(the main server will have an icon to start the fullstack front/backend server thanks to the installer)." Earlier the
same day: "make it easy for the user to update the app when a new version comes out" (task 219, `/update`).

## Two kinds of device

- **The main computer** runs everything: Ollama and the model, Pi, Gate, the web workbench. The installer puts it there
  and leaves **an icon** (the Dock and Applications on a Mac, the Start menu on Windows, the applications menu on Linux)
  that starts the whole workbench and opens it in the browser.
- **Every other device** (a phone, a second laptop) only opens the main computer's workbench over Tailscale. It can add
  the workbench as an app (a PWA: an icon, full screen), and the offer says plainly that nothing runs on this device.

## The installers (GitHub Releases)

Each release on GitHub carries:

| | What the person does | What it does |
|---|---|---|
| macOS | download `Install Pi Workbench.command` (or the .pkg once signed), double-click | the steps below, then `Pi Workbench.app` in Applications |
| Linux | `curl -fsSL https://github.com/<repo>/releases/latest/download/install.sh \| sh` | the steps below, then a `.desktop` entry |
| Windows | download `Install-PiWorkbench.ps1` and run it (or the signed .msi later) | the steps below, then a Start menu shortcut |

The steps, the same everywhere, each said in plain words and each download after a yes: install **uv** (it brings
Python), check **git**, install **Ollama** (or point to its installer), **clone** this repository into the person's
folder (`~/pi-local-harness`), run `harness/install.py`, run `plh setup` (the headless shell; Tailwind on first use),
offer to **pull a model** that fits the machine (or choose a frontier model when the machine is too small), create the
**icon**, and open the workbench. A second run of the installer repairs or updates instead of failing.

**The icon** runs `plh` without a visible terminal (a launcher keeps it in the background, with a menu-bar or tray item
to quit), then opens the workbench in the default browser. Terminal Pi stays available by typing `plh`.

**Releases and updates.** A tag `vX.Y.Z` builds the release (a GitHub Actions workflow): release notes in plain words
from the commits (the same words `/update` shows), the installers attached. An installed copy follows **releases**, not
every commit on main: `/update` and the web's Check for Updates… offer the newest release. (A developer's checkout keeps
following its branch.)

## Windows and Linux: what must change in the harness first

The harness assumes macOS today. Before the Windows installer is offered: Ollama's settings (launchctl on the Mac;
environment variables or its config on Windows and Linux), the Trash (the Finder; the Recycle Bin; the freedesktop
trash), speech to text (MLX Whisper is Apple-only: whisper.cpp or faster-whisper elsewhere), process groups (Windows
has none: job objects), paths and shells in Gate's rules (PowerShell), the headless shell's platform (already in
`plh setup`), Tailscale's path. Linux is close to macOS; Windows is the larger port. Plan 198 already put "Windows and
Linux after the starter project and the bench's stack track".

## The workbench as a PWA (other devices only)

- A web app manifest, icons and a service worker for the workbench's own pages (the shell only: the workbench never
  works without the main computer; offline shows "Can't reach the Mac", Ph_Offline).
- **Offered only away from the main computer:** the page adds its manifest only when it is not opened at 127.0.0.1 /
  localhost, so the main computer's browser never offers to install it; the main computer has its icon.
- **The offer** (for the designer: an install sheet, since iPhone has no automatic prompt): "Add Pi Workbench to this
  phone. It opens the workbench running on <Mac name>: Pi and the model keep running there, nothing runs on this phone.
  The Mac must be on and Tailscale connected." with the steps for iPhone (Share › Add to Home Screen) and Android
  (Install app). Shown once, then in π › Add to Home Screen….

## Decisions for the person

1. **Signing.** A double-click installer without warnings needs signing: an Apple Developer ID (yearly fee) for the Mac
   (.pkg, notarized), a code-signing certificate for Windows. Without them, the Mac shows "cannot be opened" until the
   person allows it in System Settings, and Windows shows SmartScreen. Proposed: start unsigned (script installers,
   with the steps to allow them explained), sign later.
2. **Windows now or after the port?** Proposed: Mac and Linux installers first; Windows once the harness runs there.
3. **Release channel.** Proposed: installed copies follow tagged releases; `/update` offers the newest release.


## Round 9 installer UI (task 243)

Use the same π tile as `design/app-icons/` in the Dock and the menu bar or tray. The installer owns this native item: current state (Working in the project / Ready / Needs attention), Gate's count, Open Pi Workbench (default), Open on Phone…, Copy Address, Start at Login, Check for Updates…, Quit Pi Workbench. Quitting during work asks first, with Cancel as the default, explains which request stops, and retains it in Activity as Interrupted. Build the native lifecycle with the installers; the web workbench provides the icon, update window and remote Home Screen instructions.
