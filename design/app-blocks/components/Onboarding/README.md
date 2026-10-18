# Onboarding

The first time the app opens: choose the language, see in one sentence each what the app does, and start with one real action. Three steps, skippable, never shown again.

| | |
| --- | --- |
| Group | App shell |
| Basecoat | `card`, `btn`, `input` (radio), `label` |
| Route | `/welcome` (or shown over `/` when `onboarded` is false) |
| Needs | A saved flag `onboarded` (account setting on the web, `localStorage` with no server) and the language setting |
| Links to | SettingsPage (language), EditForm or the app's first create action, Help |

## Markup

```html
<main class="app grid min-h-dvh place-items-center bg-muted/40 p-4">
  <section class="card w-full max-w-md" aria-labelledby="welcome-title" aria-describedby="welcome-step">
    <header class="gap-3">
      <p id="welcome-step" class="text-muted-foreground text-xs" data-t="welcome.step">Step 1 of 3</p>
      <h1 id="welcome-title" class="text-xl font-semibold" data-t="welcome.1.title">Welcome to Class Notes</h1>
      <p class="text-muted-foreground text-sm" data-t="welcome.1.body">Choose your language. You can change it later in Settings.</p>
    </header>
    <section>
      <fieldset class="grid gap-2" role="radiogroup" aria-labelledby="welcome-title">
        <label class="label gap-3 rounded-md border p-3 font-normal has-[:checked]:border-primary">
          <input class="input" type="radio" name="lang" value="en" checked>
          <span lang="en">English</span>
        </label>
        <label class="label gap-3 rounded-md border p-3 font-normal has-[:checked]:border-primary">
          <input class="input" type="radio" name="lang" value="ja">
          <span lang="ja">日本語</span>
        </label>
      </fieldset>
    </section>
    <footer class="flex items-center justify-between gap-2">
      <button class="btn" data-variant="ghost" type="button" id="welcome-skip" data-t="welcome.skip">Skip</button>
      <div class="flex items-center gap-3">
        <ol class="flex gap-1.5" aria-hidden="true">
          <li class="size-2 rounded-full bg-primary"></li>
          <li class="size-2 rounded-full bg-muted-foreground/30"></li>
          <li class="size-2 rounded-full bg-muted-foreground/30"></li>
        </ol>
        <button class="btn" type="button" id="welcome-next" data-t="welcome.next">Next</button>
      </div>
    </footer>
  </section>
</main>
```

Step 2 replaces `section` with up to three lines of what the app does:

```html
<section>
  <ul class="grid gap-3 text-sm">
    <li class="flex gap-3"><span class="bg-muted grid size-8 shrink-0 place-items-center rounded-md" aria-hidden="true">✎</span><span data-t="welcome.2.write">Write notes in English and Japanese, with furigana.</span></li>
    <li class="flex gap-3"><span class="bg-muted grid size-8 shrink-0 place-items-center rounded-md" aria-hidden="true">#</span><span data-t="welcome.2.subjects">Group them by subject: Grammar, Vocabulary, Kanji.</span></li>
    <li class="flex gap-3"><span class="bg-muted grid size-8 shrink-0 place-items-center rounded-md" aria-hidden="true">↻</span><span data-t="welcome.2.offline">They’re saved on this device and work offline.</span></li>
  </ul>
</section>
```

Step 3's footer ends with the app's first real action: `<a class="btn" href="/notes/new" data-t="welcome.3.start">Write Your First Note</a>` (and Back instead of Skip).

## States

| State | What changes |
| --- | --- |
| Step 1 | Language. Choosing a radio switches the page's language at once (the texts re-render), before Next. |
| Step 2 | What the app does; Back appears left of Next, Skip stays. |
| Step 3 | One sentence and the first action; Next becomes `welcome.3.start`; Skip becomes Back. |
| Skipped or finished | `onboarded = true`; go to `/` (or to the first action's page). Never shown again; Help links to `/welcome` to see it once more. |
| Coming back mid-way | Starts at the step it left. |
| Saving the flag failed | Continue anyway; try again on the next page load. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `welcome.step` | Step {n} of {total} | ステップ {n}/{total} |
| `welcome.1.title` | Welcome to {app} | {app} へようこそ |
| `welcome.1.body` | Choose your language. You can change it later in Settings. | 言語を選んでください。あとで設定から変更できます。 |
| `welcome.2.title` | What you can do | できること |
| `welcome.2.write` | Write notes in English and Japanese, with furigana. | 英語と日本語でノートを書けます。ふりがなも付けられます。 |
| `welcome.2.subjects` | Group them by subject: Grammar, Vocabulary, Kanji. | 文法・単語・漢字など、科目ごとにまとめられます。 |
| `welcome.2.offline` | They’re saved on this device and work offline. | このデバイスに保存され、オフラインでも使えます。 |
| `welcome.3.title` | Start with one note | まずは1つ書いてみましょう |
| `welcome.3.body` | A title is enough. You can add the rest later. | タイトルだけで大丈夫です。残りはあとで追加できます。 |
| `welcome.3.start` | Write Your First Note | 最初のノートを書く |
| `welcome.skip` | Skip | スキップ |
| `welcome.next` | Next | 次へ |
| `welcome.back` | Back | 戻る |

## Keyboard and focus

1. (step 1) the language radios (↑ ↓ move and choose) → 2. Skip → 3. Next.
- Focus moves to the step's heading (`tabindex="-1"`) on each step, so the new text is read.
- Return on Next moves on; Esc does nothing (Skip is explicit).

## Phone

- The card fills the width; the footer keeps Skip left and Next right, both 44 px. Radio rows are 56 px with 22 px radios.
- Swiping is not needed; buttons do it.

## Data

```json
{"onboarded": false, "step": 1, "language": "ja"}
```

- Web: `POST /settings` with `language` and `onboarded=1`; the base template redirects to `/welcome` while `onboarded` is false (except for `/welcome`, `/logout`, static files).
- No server: `localStorage['onboarded'] = '1'` inside try/catch; if storage fails, show onboarding once per session at most.

## Don't

- Don't go over three steps, or tour the interface with pointing bubbles.
- Don't ask for permissions (notifications, location) here; ask when the feature needs them.
- Don't use pictures in place of the sentences.
