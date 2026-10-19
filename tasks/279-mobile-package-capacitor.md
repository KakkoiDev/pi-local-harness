# 279: The mobile package: the same app in a Capacitor shell, installed without a store

Kind: code

Plan 198 (Phones: PWA first, Capacitor the one native way, installs without a store) and plan 253 (mobile is a package
of the same source). Depends on task 277 (the bundled package is the browser package).

Files: kit/adapters/mobile/ (capacitor.config template, the native project templates' settings, bridge notes),
kit/package.py (target "mobile": bundled or connected, decision 5), harness/phone.py (`plh phone android` and
`plh phone ios`), kit/toolchain.json (Capacitor, JDK, Android command-line tools pins), kit/school (the install lesson
links), tests/test_phone.py, tests/test_package.py.

- [ ] Ask the person: the mobile default (decision 5), the Android signing key custody (decision 6), the iPhone route
  (decision 7) and the downloads (decision 8: the Capacitor npm packages through the toolchain's Node, a JDK and Android
  command-line tools, sizes and licences on the card). Nothing is fetched before the yes.
- [ ] Red: `build(project, "mobile")` fails; a test checks the generated capacitor.config (app id from packaging.json,
  webDir = dist/web for bundled, server URL = the person's tailnet address for connected, no cleartext HTTP).
- [ ] Bundled mode copies dist/web into the shell; connected mode points it at the full-stack server; offline in bundled
  mode relies on the bundled files, not on a service worker inside the WebView.
- [ ] Android: build and sign the APK with the project's key (kept in the data folder, never in the repository; backup
  reminder), serve it over the tailnet with a QR code; a GitHub release only after the person's yes (plan 198).
- [ ] iPhone: generate the Xcode project, open it, and explain Apple's signing rules in plain words before building; the
  Apple ID sign-in is the person's, never typed by Pi.
- [ ] Green: the config and build tests pass with the toolchain faked; with the real toolchain installed, a scratch
  project's APK builds and its signature verifies; the full workflow passes.

Acceptance: one command makes an installable Android package from the same source, an Xcode project for iPhone, and says
honestly which steps are the person's.

## Scenarios

### US-new plh phone android builds a signed APK and shows a QR code to install it over my tailnet
Given a project packaged for mobile with the Android toolchain installed
When I run `plh phone android`
Then a signed APK is built with the project's key and a QR code to install it over my tailnet is shown, with a reminder to back up the key

### US-new plh phone ios opens the Xcode project and explains Apple’s signing; the Apple ID sign-in stays mine
Given a project packaged for mobile on a Mac with Xcode
When I run `plh phone ios`
Then the Xcode project opens and Apple's signing rules are explained in plain words, saying the Apple ID sign-in is my step
