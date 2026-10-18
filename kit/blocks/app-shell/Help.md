# Help

App Block card (App shell). Answers to the questions people actually ask, searchable, in short sections, with the keyboard shortcuts and a way to reach a person when the answer isn't there.

- Basecoat: `input-group` (search), `accordion`, `card`, `kbd`, `btn`
- Route: `/help`, `/help#<question-id>` opens one answer
- Needs: Questions and answers in `messages/<lang>.json` (`help.q.*`, `help.a.*`); the app's contact address
- Links to: ShortcutHelp, About, Onboarding (`/welcome` to see it again), SettingsPage

## Markup
Copy, never retype: `{harness}/kit/blocks/app-shell/Help.html` (51 lines of HTML).

The placeholder and `aria-label` of the search come from `help.search`. The static starter's `data-t` only fills element text, so set the two attributes in code (`search.placeholder = search.ariaLabel = t('help.search')`); the web starter writes `{{ t("help.search") }}` in both attributes.

## States
- Default: Sections with every question closed.
- Opened from a link: `/help#offline` opens that `details` and scrolls to it.
- Searching: Typing filters `details` by question and answer text (both languages' current one); non-matching ones get `hidden`; empty sections are hidden too.
- No match: Under the search: `help.no_match` with the search words, and the contact card stays visible.
- Address copied: The button reads `help.contact.copied` for 2 s. Copy failure selects the address instead.
- Offline: Help works offline (it's in the app); only the contact card notes `help.contact.offline`.

## Texts
(Key | English | 日本語)
- `help.title`: Help | ヘルプ
- `help.search`: Search help | ヘルプを検索
- `help.section.notes`: Notes | ノート
- `help.q.furigana`: How do I add furigana? | ふりがなを付けるには？
- `help.a.furigana`: Select the kanji, then press Furigana in the toolbar and type the reading. It shows above the kanji. | 漢字を選択し、ツールバーの「ふりがな」を押して読みを入力します。漢字の上に表示されます。
- `help.q.offline`: Does it work without internet? | インターネットなしでも使えますか？
- `help.a.offline`: Yes. Notes are saved on your device and sync when you’re back online. | はい。ノートはデバイスに保存され、オンラインに戻ると同期されます。
- `help.keys`: Keyboard shortcuts | キーボードショートカット
- `help.key.new`: New note | 新しいノート
- `help.key.search`: Search | 検索
- `help.key.all`: All shortcuts | すべてのショートカット
- `help.no_match`: Nothing matches “{query}”. Try other words, or write to us. | 「{query}」に一致する項目はありません。別の言葉で検索するか、お問い合わせください。
- `help.contact.title`: Still stuck? | 解決しませんか？
- `help.contact.body`: Write to us and say what you tried. We answer within two working days. | 試したことを書いてお送りください。2営業日以内にお返事します。
- `help.contact.copy`: Copy Address | アドレスをコピー
- `help.contact.copied`: Copied | コピーしました
- `help.contact.offline`: You’re offline. Your message can be sent when you’re back. | オフラインです。オンラインに戻ると送信できます。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Help` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
