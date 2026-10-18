# AppForum

A forum or community: categories of topics, replies with reactions and mentions, profiles, notifications, and the moderation tools that keep it kind.

| | |
| --- | --- |
| Group | Apps |
| Example product | Crumb Circle (a community for home bakers) |
| Blocks | ActivityFeed, AvatarGroup, Breadcrumbs, Comments, ConfirmDialog, DataTable, DetailView, DocEditor, EditForm, EmailConfirm, EmptyState, FileUpload, GlobalSearch, InfiniteScroll, ListSearch, LogIn, Mentions, Notifications, Onboarding, Profile, Reactions, ReportContent, Roles, SignUp, StatusBadges, Tabs, TagInput, Threads, TopBar |
| Packages | Web app (full stack). Posts are public and shared, so it needs a server. |
| Related | AppChat (real-time instead of topics), AppCourse (a course can have a forum) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Topics | `/` | TopBar, Tabs, ListSearch, InfiniteScroll, StatusBadges |
| Category | `/c/{slug}` | Breadcrumbs, ListSearch, InfiniteScroll |
| Topic | `/t/{id}/{slug}` | Breadcrumbs, Comments, Reactions, Mentions, Threads, ReportContent |
| New topic | `/new` | EditForm, DocEditor, TagInput, FileUpload |
| Member | `/u/{name}` | Profile, ActivityFeed, AvatarGroup |
| Notifications | `/notifications` | Notifications, EmptyState |
| Search | `/search` | GlobalSearch |
| Moderation | `/mod` | DataTable, DetailView, ConfirmDialog, Roles |
| Join | `/signup` | SignUp, LogIn, EmailConfirm, Onboarding |

## Navigation

- TopBar: community name, Categories, Search, New Topic, Notifications, the member's avatar menu. Topics list has Tabs Latest · Top · Unanswered and a category filter.
- Phone: BottomBar Home · Search · New · Notifications · You.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Ask a question**

1. Topics: New Topic
2. New topic: EditForm title, category, DocEditor body, TagInput tags
3. Topic: replies arrive (Comments); Mark as Solution on the best one

**Join in**

1. Join: SignUp, EmailConfirm, Onboarding picks interests
2. Topic: reply with Mentions @Aiko; Reactions on a helpful answer

**Moderate**

1. Topic: a member uses ReportContent on a post (reason, details); they see Reported
2. Moderation: DataTable of reports by reason, then DetailView, Hide Post or Warn Member (ConfirmDialog states what the member sees)

## Phone

- Topic list rows keep title, category and reply count; the composer for a reply opens as a full-screen sheet with Post and Cancel.

## Data model

| Table | Fields |
| --- | --- |
| `categories` | id, slug, name_en, name_ja, description, position |
| `topics` | id, category_id, author_id, title, solved_post_id, pinned, closed, created_at, last_post_at, reply_count |
| `posts` | id, topic_id, author_id, body (Markdown), reply_to_post_id, hidden_reason, created_at, edited_at |
| `reactions` | post_id, user_id, emoji · `tags`: topic_id, tag |
| `reports` | id, post_id, reporter_id, reason, status (open · actioned · dismissed), handled_by |

## Capabilities and packages

Capabilities: **Log in and accounts**, **Sharing and roles** (moderators), **Database**, **File uploads**, **Admin pages**. Package: **Web app (full stack)**.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Crumb Circle | クラムサークル |
| `nav.categories` | Categories | カテゴリ |
| `nav.new_topic` | New Topic | トピックを作成 |
| `nav.notifications` | Notifications | 通知 |
| `topics.latest` | Latest | 新着 |
| `topics.top` | Top | 人気 |
| `topics.unanswered` | Unanswered | 未回答 |
| `topic.mark_solution` | Mark as Solution | 解決済みにする |

## Adding to it

- Reporting a post is **ReportContent** (reasons, details, sent, already reported); its reasons are the Moderation table's filter.
