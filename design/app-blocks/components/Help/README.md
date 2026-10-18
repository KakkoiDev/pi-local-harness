# Help

Answers to the questions people actually ask, searchable, in short sections, with the keyboard shortcuts and a way to reach a person when the answer isn't there.

| | |
| --- | --- |
| Group | App shell |
| Basecoat | `input-group` (search), `accordion`, `card`, `kbd`, `btn` |
| Route | `/help`, `/help#<question-id>` opens one answer |
| Needs | Questions and answers in `messages/<lang>.json` (`help.q.*`, `help.a.*`); the app's contact address |
| Links to | ShortcutHelp, About, Onboarding (`/welcome` to see it again), SettingsPage |

## Markup

```html
<main class="app mx-auto grid w-full max-w-2xl gap-6 p-4 @3xl:p-8">
  <header class="grid gap-3">
    <h1 class="text-2xl font-semibold" data-t="help.title">Help</h1>
    <div class="input-group @max-3xl:h-11">
      <span data-align="inline-start"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
      <input type="search" id="help-search" placeholder="Search help" data-t-placeholder="help.search" aria-label="Search help" data-t-label="help.search" aria-controls="help-list">
    </div>
  </header>

  <section aria-labelledby="help-notes">
    <h2 id="help-notes" class="text-muted-foreground mb-1 text-sm font-medium" data-t="help.section.notes">Notes</h2>
    <div class="accordion" id="help-list">
      <details id="furigana">
        <summary>
          <span data-t="help.q.furigana">How do I add furigana?</span>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </summary>
        <p data-t="help.a.furigana">Select the kanji, then press Furigana in the toolbar and type the reading. It shows above the kanji.</p>
      </details>
      <details id="offline">
        <summary>
          <span data-t="help.q.offline">Does it work without internet?</span>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </summary>
        <p data-t="help.a.offline">Yes. Notes are saved on your device and sync when you’re back online.</p>
      </details>
    </div>
  </section>

  <section class="card" aria-labelledby="help-keys">
    <header><h2 id="help-keys" class="font-semibold" data-t="help.keys">Keyboard shortcuts</h2></header>
    <section>
      <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
        <dt data-t="help.key.new">New note</dt><dd><kbd class="kbd">N</kbd></dd>
        <dt data-t="help.key.search">Search</dt><dd><kbd class="kbd">/</kbd></dd>
        <dt data-t="help.key.all">All shortcuts</dt><dd><kbd class="kbd">?</kbd></dd>
      </dl>
    </section>
  </section>

  <section class="card" aria-labelledby="help-contact">
    <header>
      <h2 id="help-contact" class="font-semibold" data-t="help.contact.title">Still stuck?</h2>
      <p class="text-muted-foreground text-sm" data-t="help.contact.body">Write to us and say what you tried. We answer within two working days.</p>
    </header>
    <footer class="flex flex-wrap items-center gap-3">
      <span class="font-mono text-sm select-all">help@classnotes.example</span>
      <button class="btn" data-variant="outline" data-size="sm" type="button" id="help-copy" data-t="help.contact.copy">Copy Address</button>
    </footer>
  </section>
</main>
```

The placeholder and `aria-label` of the search come from `help.search`. The static starter's `data-t` only fills element text, so set the two attributes in code (`search.placeholder = search.ariaLabel = t('help.search')`); the web starter writes `{{ t("help.search") }}` in both attributes.

## States

| State | What changes |
| --- | --- |
| Default | Sections with every question closed. |
| Opened from a link | `/help#offline` opens that `details` and scrolls to it. |
| Searching | Typing filters `details` by question and answer text (both languages' current one); non-matching ones get `hidden`; empty sections are hidden too. |
| No match | Under the search: `help.no_match` with the search words, and the contact card stays visible. |
| Address copied | The button reads `help.contact.copied` for 2 s. Copy failure selects the address instead. |
| Offline | Help works offline (it's in the app); only the contact card notes `help.contact.offline`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `help.title` | Help | ヘルプ |
| `help.search` | Search help | ヘルプを検索 |
| `help.section.notes` | Notes | ノート |
| `help.q.furigana` | How do I add furigana? | ふりがなを付けるには？ |
| `help.a.furigana` | Select the kanji, then press Furigana in the toolbar and type the reading. It shows above the kanji. | 漢字を選択し、ツールバーの「ふりがな」を押して読みを入力します。漢字の上に表示されます。 |
| `help.q.offline` | Does it work without internet? | インターネットなしでも使えますか？ |
| `help.a.offline` | Yes. Notes are saved on your device and sync when you’re back online. | はい。ノートはデバイスに保存され、オンラインに戻ると同期されます。 |
| `help.keys` | Keyboard shortcuts | キーボードショートカット |
| `help.key.new` | New note | 新しいノート |
| `help.key.search` | Search | 検索 |
| `help.key.all` | All shortcuts | すべてのショートカット |
| `help.no_match` | Nothing matches “{query}”. Try other words, or write to us. | 「{query}」に一致する項目はありません。別の言葉で検索するか、お問い合わせください。 |
| `help.contact.title` | Still stuck? | 解決しませんか？ |
| `help.contact.body` | Write to us and say what you tried. We answer within two working days. | 試したことを書いてお送りください。2営業日以内にお返事します。 |
| `help.contact.copy` | Copy Address | アドレスをコピー |
| `help.contact.copied` | Copied | コピーしました |
| `help.contact.offline` | You’re offline. Your message can be sent when you’re back. | オフラインです。オンラインに戻ると送信できます。 |

## Keyboard and focus

1. Search → 2. each question (Return or Space opens and closes) → 3. Copy Address.
- `/` anywhere in the app focuses the search when on `/help`; `?` opens ShortcutHelp.
- Esc in the search clears it.

## Phone

- The search field is 44 px tall (`@max-3xl:h-11` on the `input-group`; App foundations only covers bare `.input`).
- One column; question rows are 44 px+ and wrap; the shortcuts card is hidden below 48rem (`@max-3xl:hidden`), since phones rarely have keyboards.
- The address is selectable and the copy button is 44 px; `mailto:` links are a convenience, not the only way.

## Data

```json
{"sections": [{"id": "notes", "title": "help.section.notes", "items": [{"id": "furigana", "q": "help.q.furigana", "a": "help.a.furigana"}]}],
 "contact": "help@classnotes.example"}
```

- Web and no server alike: render from the messages file; filter in the browser (no server search needed under ~200 questions).

## Don't

- Don't write a manual; one question, one short answer.
- Don't add a chat bubble or a bot.
- Don't put the answers in images.
