# ArticleBody

App Block card (Content). The read-only body of an article or blog post: title and meta with reading time, headings, images with captions, quotes, code and footnotes, styled with plain utilities.

- Basecoat: `btn` (Copy), `skeleton`, `empty`; the rest is Tailwind on plain elements
- Route: `/posts/<slug>` (blog), `/work/<slug>` (case study)
- Needs: Web: `GET /posts/<slug>` rendering stored Markdown; no server: Markdown rendered at build time
- Links to: DocEditor (where it is written), Comments, Skeletons, EmptyState; used in AppPortfolio and AppForum

## Markup
Copy, never retype: `{harness}/kit/blocks/content/ArticleBody.html` (45 lines of HTML).

- The whole body is styled with plain utilities on each element (the starters don’t load the typography plugin, so no `prose`). Keep this set: `h1 text-3xl`, `h2 text-xl mt-4`, paragraphs at `text-base leading-7`, lists `list-decimal`/`list-disc pl-6`, `blockquote border-l-2 pl-4`, inline `code bg-muted`, `pre bg-muted overflow-x-auto`.
- Line length stays readable: the article is `max-w-[68ch]`, centred. Japanese text keeps the same width (the line height grows by App foundations' `:lang(ja)` rule).
- Images always have `alt`, `width` and `height` (no layout jump) and a `figcaption` when the picture needs words.
- Footnotes are links both ways: the number in the text (`#fn-1`) and ↩ back (`#fnref-1`).
- Reading time is the word count ÷ 200 (English) or the character count ÷ 500 (Japanese), rounded up.

## States
- Loading: Skeletons for the title, meta, three lines and the image (Skeletons).
- Image fails: The `img` is replaced by a dashed box with `article.image_missing` (the alt text filled in), same aspect ratio.
- Long code: The `pre` scrolls sideways inside its box; the page never scrolls sideways.
- Copy code: Copy writes the code to the clipboard; the button text changes to `article.copied` for 2 seconds.
- Updated: The meta line adds `article.updated` only when the post changed after it was published.
- Not found: The empty block `article.not_found`, and status 404 on the web.
- Many headings: From three `h2`, the desktop shows “On this page” (`article.contents`) beside the article; the phone doesn’t.

## Texts
(Key | English | 日本語)
- `article.by`: By {author} | {author}
- `article.reading_time`: {minutes} min read | 約{minutes}分で読めます
- `article.updated`: Updated {date} | {date}更新
- `article.notes`: Notes | 注
- `article.back_to_ref`: Back to the text | 本文に戻る
- `article.copy_code`: Copy | コピー
- `article.copied`: Copied | コピーしました
- `article.image_missing`: Image not available: {alt} | 画像を表示できません：{alt}
- `article.contents`: On this page | このページの内容
- `article.not_found`: This post doesn’t exist or was removed. | この記事は存在しないか、削除されました。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ArticleBody` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
