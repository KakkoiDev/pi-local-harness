# ArticleBody

The read-only body of an article or blog post: title and meta with reading time, headings, images with captions, quotes, code and footnotes, styled with plain utilities.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `btn` (Copy), `skeleton`, `empty`; the rest is Tailwind on plain elements |
| Route | `/posts/<slug>` (blog), `/work/<slug>` (case study) |
| Needs | Web: `GET /posts/<slug>` rendering stored Markdown; no server: Markdown rendered at build time |
| Links to | DocEditor (where it is written), Comments, Skeletons, EmptyState; used in AppPortfolio and AppForum |

## Markup

```html
<article id="post" class="mx-auto grid w-full min-w-0 max-w-[68ch] grid-cols-[minmax(0,1fr)] gap-5 text-base leading-7" aria-labelledby="post-title">
  <header class="grid gap-3">
    <h1 id="post-title" class="text-3xl font-semibold leading-tight tracking-tight text-balance">Designing a timetable you can read at a glance</h1>
    <p class="text-lg text-muted-foreground">Three things we changed after watching people use the trip planner on a crowded platform.</p>
    <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span data-t="article.by">By Hana Ito</span>
      <time datetime="2026-10-18">18 Oct 2026</time>
      <span data-t="article.reading_time">6 min read</span>
      <span data-t="article.updated">Updated 19 Oct 2026</span>
    </p>
  </header>
  <h2 class="mt-4 text-xl font-semibold" id="big-times">Big times, small words</h2>
  <p>People read the departure time first and the platform second. So the time is the largest thing on the row, and the platform number sits right beside it.<sup><a class="underline underline-offset-2" href="#fn-1" id="fnref-1" aria-describedby="notes-title">1</a></sup></p>
  <ol class="list-decimal pl-6"><li>Departure time, large</li><li>Platform, beside the time</li><li>Line and stops, small</li></ol>
  <figure class="grid gap-2">
    <img src="/media/timetable-row.png" alt="A timetable row with the time 9:52 in large type and platform 3 beside it" width="1280" height="520" class="w-full rounded-md border" loading="lazy">
    <figcaption class="text-sm text-muted-foreground">The new row: time first, platform next to it, the rest smaller.</figcaption>
  </figure>
  <blockquote class="border-l-2 pl-4 italic">
    <p>“I only look for two things: when, and which platform.”</p>
    <footer class="mt-1 text-sm not-italic text-muted-foreground">— A commuter at Kyoto Station</footer>
  </blockquote>
  <h2 class="mt-4 text-xl font-semibold" id="times-in-data">Times in the data, not in the view</h2>
  <p>We store times with their time zone and format them only when we show them: <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">Intl.DateTimeFormat</code>.</p>
  <div class="grid gap-1">
    <div class="flex justify-end"><button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="article.copy_code">Copy</button></div>
    <pre class="overflow-x-auto rounded-md border bg-muted p-4 font-mono text-sm leading-6"><code>const fmt = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" });
fmt.format(new Date("2026-10-18T09:52:00+09:00")); // "09:52"</code></pre>
  </div>
  <section aria-labelledby="notes-title" class="mt-4 grid gap-2 border-t pt-4 text-sm text-muted-foreground">
    <h2 id="notes-title" class="font-medium text-foreground" data-t="article.notes">Notes</h2>
    <ol class="list-decimal pl-5">
      <li id="fn-1">Measured with 12 people in September 2026; see the study notes. <a class="underline underline-offset-2" href="#fnref-1" aria-label="Back to the text" data-t-label="article.back_to_ref">↩</a></li>
    </ol>
  </section>
</article>

<!-- when the image can’t load: the same box, same ratio -->
<div class="grid aspect-[16/6.5] place-items-center rounded-md border border-dashed bg-muted p-4 text-center text-sm text-muted-foreground" role="img" aria-label="A timetable row with the time 9:52 in large type and platform 3 beside it" data-t="article.image_missing">Image not available: A timetable row with the time 9:52 in large type and platform 3 beside it</div>

<!-- desktop only, beside the article when it has 3 or more h2 -->
<nav aria-labelledby="toc-title" class="grid gap-2 text-sm">
  <h2 id="toc-title" class="font-medium" data-t="article.contents">On this page</h2>
  <ul class="grid gap-1 border-l pl-3 text-muted-foreground"><li><a class="hover:text-foreground" href="#big-times">Big times, small words</a></li><li><a class="hover:text-foreground" href="#times-in-data">Times in the data, not in the view</a></li></ul>
</nav>
```

- The whole body is styled with plain utilities on each element (the starters don’t load the typography plugin, so no `prose`). Keep this set: `h1 text-3xl`, `h2 text-xl mt-4`, paragraphs at `text-base leading-7`, lists `list-decimal`/`list-disc pl-6`, `blockquote border-l-2 pl-4`, inline `code bg-muted`, `pre bg-muted overflow-x-auto`.
- Line length stays readable: the article is `max-w-[68ch]`, centred. Japanese text keeps the same width (the line height grows by App foundations' `:lang(ja)` rule).
- Images always have `alt`, `width` and `height` (no layout jump) and a `figcaption` when the picture needs words.
- Footnotes are links both ways: the number in the text (`#fn-1`) and ↩ back (`#fnref-1`).
- Reading time is the word count ÷ 200 (English) or the character count ÷ 500 (Japanese), rounded up.

## States

| State | What changes |
| --- | --- |
| Loading | Skeletons for the title, meta, three lines and the image (Skeletons). |
| Image fails | The `img` is replaced by a dashed box with `article.image_missing` (the alt text filled in), same aspect ratio. |
| Long code | The `pre` scrolls sideways inside its box; the page never scrolls sideways. |
| Copy code | Copy writes the code to the clipboard; the button text changes to `article.copied` for 2 seconds. |
| Updated | The meta line adds `article.updated` only when the post changed after it was published. |
| Not found | The empty block `article.not_found`, and status 404 on the web. |
| Many headings | From three `h2`, the desktop shows “On this page” (`article.contents`) beside the article; the phone doesn’t. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `article.by` | By {author} | {author} |
| `article.reading_time` | {minutes} min read | 約{minutes}分で読めます |
| `article.updated` | Updated {date} | {date}更新 |
| `article.notes` | Notes | 注 |
| `article.back_to_ref` | Back to the text | 本文に戻る |
| `article.copy_code` | Copy | コピー |
| `article.copied` | Copied | コピーしました |
| `article.image_missing` | Image not available: {alt} | 画像を表示できません：{alt} |
| `article.contents` | On this page | このページの内容 |
| `article.not_found` | This post doesn’t exist or was removed. | この記事は存在しないか、削除されました。 |

## Keyboard and focus

- Reading order is the source order: title, lede, meta, body, notes.
- Links in order: footnote numbers, Copy, the ↩ back links. A footnote link moves focus to the note; ↩ returns to the number.
- Headings are real `h1`/`h2`/`h3` so screen-reader users can jump between them.

## Phone

- Same column, 16 px sides; the title steps down to `text-2xl` below 48rem (`@max-3xl:text-2xl`).
- Images are full width; code scrolls inside its box; “On this page” is hidden.

## Data

```json
{"slug": "readable-timetable", "title": "Designing a timetable you can read at a glance", "lede": "…",
 "author": "Hana Ito", "published": "2026-10-18", "updated": "2026-10-19", "lang": "en", "reading_minutes": 6,
 "body_html": "<h2>…</h2><p>…</p>", "notes": [{"id": 1, "html": "Measured with 12 people…"}]}
```

- Web: `GET /posts/<slug>`; the body is stored as Markdown and rendered on the server to the markup above (the class names are added by the renderer, one per element type), never trusted HTML from a person.
- No server: posts are Markdown files bundled with the app, rendered at build time.

## Don't

- Don't use `prose` or other typography-plugin classes; they do nothing here.
- Don't put raw HTML from an editor into the page; render from Markdown with the classes above.
- Don't add comments, share buttons or related posts inside this block; those are Comments and separate blocks.
