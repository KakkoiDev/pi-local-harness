# AppPortfolio

A personal site: a short introduction, selected work with case studies, a blog, and a way to get in touch.

| | |
| --- | --- |
| Group | Apps |
| Example product | Hana Ito · design (a personal site with a blog) |
| Blocks | About, ArticleBody, AvatarGroup, Breadcrumbs, Comments, EditForm, Gallery, InfiniteScroll, InlineAlert, ListSearch, Reactions, SavedState, StatusBadges, Timeline, TopBar |
| Packages | App with no server (frontend only), published on GitHub Pages. The contact form needs a form service or the Web app package. |
| Related | AppCourse (its lesson pages reuse the article layout) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Home | `/` | TopBar, Gallery, Timeline |
| Work | `/work` | Gallery, ListSearch, StatusBadges |
| Case study | `/work/{slug}` | Breadcrumbs, ArticleBody, Gallery, Timeline |
| Blog | `/blog` | ListSearch, InfiniteScroll, StatusBadges |
| Post | `/blog/{slug}` | Breadcrumbs, ArticleBody, Comments, Reactions |
| About | `/about` | About, Timeline, AvatarGroup |
| Contact | `/contact` | EditForm, InlineAlert, SavedState |

## Navigation

- TopBar: the person's name (to Home), Work · Blog · About · Contact, and the language switch (English · 日本語). On the phone the links collapse into the TopBar's menu button; there is no BottomBar (a site, not an app).
- Every page ends with a footer: links again, the RSS feed, the copyright line.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**A recruiter looks**

1. Home: the introduction and three works (Gallery)
2. Case study: ArticleBody for the story, Gallery of the screens, Timeline of the project
3. Contact: EditForm (name, email, message); SavedState "Message sent"

**A reader follows the blog**

1. Blog: ListSearch by tag, InfiniteScroll for older posts
2. Post: ArticleBody (headings, images, code, footnotes), Reactions, Comments (if a server is added)

**The owner adds a post**

1. (in the project) add `content/blog/<slug>.md` with title, date, tags; the build makes the page
2. Blog: the new post is first

## Phone

- One column throughout; work thumbnails full width; the hero headline drops to 24 px. Images use `srcset` so the phone loads small ones.
- The menu button opens the links as a sheet (Tabs are not used on a site).

## Data model

| Collection | Fields (front matter of a Markdown file) |
| --- | --- |
| `content/work/*.md` | title_en, title_ja, slug, year, kind (web · mobile · product · print), cover, images[], summary_en, summary_ja, body |
| `content/blog/*.md` | title_en, title_ja, slug, date, tags[], draft, body |
| `content/site.json` | name, role_en, role_ja, links (email, social profiles), resume_pdf |

Built to static HTML at publish time; the no-server package has no database.

## Capabilities and packages

Capabilities: **GitHub Pages**, optional **Installs on a phone** (offline reading of posts). Package: **App with no server (frontend only)**. Comments on posts need **Database** and the **Web app** package; without them the Post screen leaves Comments out.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `site.name` | Hana Ito | 伊藤 花 |
| `nav.work` | Work | 仕事 |
| `nav.blog` | Blog | ブログ |
| `nav.about` | About | プロフィール |
| `nav.contact` | Contact | お問い合わせ |
| `footer.rss` | RSS Feed | RSS フィード |

## Adding to it

- A new page type (talks, a photo diary) is a `content/<kind>/` folder plus a list page (Gallery or ListSearch) and a detail page.
- Posts and case studies are Markdown rendered with **ArticleBody** (the reading layout: headings, images, code, quotes, footnotes, the reading time).
