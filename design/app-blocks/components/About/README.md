# About

What this app is, its version, who made it, and the licences of what it is built with: one quiet page reached from Settings.

| | |
| --- | --- |
| Group | App shell |
| Basecoat | `card`, `item`, `item-group`, `btn`, `accordion` |
| Route | `/about` |
| Needs | The version (from `pyproject.toml` / `manifest.webmanifest`), the build date, the third-party notices file the kit ships (`THIRD_PARTY_NOTICES.md`) |
| Links to | SettingsPage, Help, UpdateAvailable |

## Markup

```html
<main class="app mx-auto grid w-full max-w-xl gap-6 p-4 @3xl:p-8">
  <header class="grid justify-items-center gap-3 text-center">
    <img src="/static/icon.svg" alt="" width="72" height="72" class="rounded-2xl">
    <div>
      <h1 class="text-2xl font-semibold" data-t="app.name">Class Notes</h1>
      <p class="text-muted-foreground text-sm" data-t="about.tagline">Notes for our Japanese class.</p>
    </div>
  </header>

  <section class="card" aria-label="Version" data-t-label="about.version">
    <section class="item-group">
      <div class="item" data-size="sm"><section><h3 data-t="about.version">Version</h3></section><aside class="tabular-nums">1.4.0</aside></div>
      <hr>
      <div class="item" data-size="sm"><section><h3 data-t="about.updated">Last updated</h3></section><aside><time datetime="2026-10-16">16 Oct 2026</time></aside></div>
      <hr>
      <div class="item" data-size="sm"><section><h3 data-t="about.made_by">Made by</h3></section><aside>Aiko Tanaka</aside></div>
    </section>
    <footer class="flex flex-wrap gap-2">
      <a class="btn" data-variant="outline" href="/help" data-t="about.help">Help</a>
      <button class="btn" data-variant="outline" type="button" id="about-check-update" data-t="about.check_update">Check for Updates</button>
    </footer>
  </section>

  <section class="accordion" aria-label="Licences">
    <details>
      <summary>
        <span data-t="about.licences">Open-source licences</span>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <ul class="grid gap-1 text-sm">
        <li>Basecoat 1.0.2 · MIT</li>
        <li>Tailwind CSS 4.3.3 · MIT</li>
        <li>htmx 4.0.0 · Zero-Clause BSD</li>
        <li>Chart.js 4.5.1 · MIT</li>
      </ul>
      <a class="text-sm underline underline-offset-4" href="/static/THIRD_PARTY_NOTICES.md" data-t="about.licences_full">Full notices</a>
    </details>
  </section>

  <p class="text-muted-foreground text-center text-xs" data-t="about.made_with">Made with Pi Workbench</p>
</main>
```

## States

| State | What changes |
| --- | --- |
| Default | As above; licences collapsed. |
| Checking for updates | The button `disabled` + `aria-busy="true"`, `about.checking`. |
| Up to date | Under the button row: `about.up_to_date` (muted, `role="status"`). |
| Update available | UpdateAvailable's banner appears at the top of the app; the row reads `about.update_ready` with Update Now. |
| Licences open | `details[open]`; the list shows every library the app ships, from the notices file. |
| No author set | The Made by row is left out. |
| Page title | `about.title` → the page’s `<title>` and the menu item that opens About (“About Class Notes”). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Class Notes | クラスノート |
| `about.title` | About {app} | {app} について |
| `about.tagline` | Notes for our Japanese class. | 日本語クラスのためのノート。 |
| `about.version` | Version | バージョン |
| `about.updated` | Last updated | 最終更新 |
| `about.made_by` | Made by | 作成者 |
| `about.help` | Help | ヘルプ |
| `about.check_update` | Check for Updates | アップデートを確認 |
| `about.checking` | Checking… | 確認中… |
| `about.up_to_date` | You have the latest version. | 最新のバージョンです。 |
| `about.update_ready` | Version {version} is ready. | バージョン {version} の準備ができました。 |
| `about.licences` | Open-source licences | オープンソースライセンス |
| `about.licences_full` | Full notices | すべての表示 |
| `about.made_with` | Made with Pi Workbench | Pi Workbench で作成 |

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
