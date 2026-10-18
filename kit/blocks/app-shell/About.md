# About

App Block card (App shell). What this app is, its version, who made it, and the licences of what it is built with: one quiet page reached from Settings.

- Basecoat: `card`, `item`, `item-group`, `btn`, `accordion`
- Route: `/about`
- Needs: The version (from `pyproject.toml` / `manifest.webmanifest`), the build date, the third-party notices file the kit ships (`THIRD_PARTY_NOTICES.md`)
- Links to: SettingsPage, Help, UpdateAvailable

## Markup
Copy, never retype: `{harness}/kit/blocks/app-shell/About.html` (41 lines of HTML).

## States
- Default: As above; licences collapsed.
- Checking for updates: The button `disabled` + `aria-busy="true"`, `about.checking`.
- Up to date: Under the button row: `about.up_to_date` (muted, `role="status"`).
- Update available: UpdateAvailable's banner appears at the top of the app; the row reads `about.update_ready` with Update Now.
- Licences open: `details[open]`; the list shows every library the app ships, from the notices file.
- No author set: The Made by row is left out.

## Texts
(Key | English | 日本語)
- `app.name`: Class Notes | クラスノート
- `about.title`: About {app} | {app} について
- `about.tagline`: Notes for our Japanese class. | 日本語クラスのためのノート。
- `about.version`: Version | バージョン
- `about.updated`: Last updated | 最終更新
- `about.made_by`: Made by | 作成者
- `about.help`: Help | ヘルプ
- `about.check_update`: Check for Updates | アップデートを確認
- `about.checking`: Checking… | 確認中…
- `about.up_to_date`: You have the latest version. | 最新のバージョンです。
- `about.update_ready`: Version {version} is ready. | バージョン {version} の準備ができました。
- `about.licences`: Open-source licences | オープンソースライセンス
- `about.licences_full`: Full notices | すべての表示
- `about.made_with`: Made with Pi Workbench | Pi Workbench で作成

## Keyboard and focus
1. Help → 2. Check for Updates → 3. Open-source licences (Return or Space opens) → 4. Full notices.
- The version text is selectable so it can be copied into a message.

## Phone
- Centred header, one column; the two buttons wrap and stay 44 px. The licences list scrolls with the page.

## Data
```json
{"name": "Class Notes", "version": "1.4.0", "updated": "2026-10-16", "author": "Aiko Tanaka",
 "libraries": [{"name": "Basecoat", "version": "1.0.2", "licence": "MIT"}]}
```

- Web: `GET /about` renders from the app's settings; the libraries list is read from `THIRD_PARTY_NOTICES.md` at build time.
- No server: a `about.json` written by the build.

## Don't
- Don't put marketing text, ratings prompts or social links here.
- Don't hard-code the version in the template; read it.
- Don't leave out the licences: the kit's libraries require their notices.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> About` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
