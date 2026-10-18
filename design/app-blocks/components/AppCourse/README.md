# AppCourse

A course or learning app: courses made of lessons (video or text), quizzes, progress that is kept, and a certificate or a streak at the end.

| | |
| --- | --- |
| Group | Apps |
| Example product | Sakura Steps (a course and learning app) |
| Blocks | BarChart, Breadcrumbs, Dashboard, DataTable, DocEditor, EmptyState, Flashcards, Gallery, GaugeRing, HeatmapCalendar, InstallApp, Invite, KpiTile, ProductGrid, ProgressStatus, QuizQuestion, SavedState, SettingsPage, Stepper, Timeline, Toasts, TopBar |
| Packages | App with no server (frontend only) with Works offline for one learner; Web app (full stack) when progress follows the learner across devices or a teacher sees a class. |
| Related | AppForum (questions about a lesson), AppNotes (lesson pages) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| My courses | `/` | TopBar, ProductGrid, ProgressStatus, EmptyState |
| Course | `/c/{slug}` | Breadcrumbs, Stepper, Timeline, ProgressStatus |
| Lesson | `/c/{slug}/{lesson}` | DocEditor, Gallery, ProgressStatus, SavedState |
| Quiz | `/c/{slug}/{lesson}/quiz` | QuizQuestion, ProgressStatus |
| Flashcards | `/c/{slug}/cards` | Flashcards, ProgressStatus, EmptyState |
| Results | `/c/{slug}/{lesson}/quiz/result` | KpiTile, GaugeRing, Toasts |
| Progress | `/progress` | Dashboard, HeatmapCalendar, KpiTile |
| Class (teacher) | `/teach/{class}` | DataTable, Invite, BarChart |
| Settings | `/settings` | SettingsPage, InstallApp |

## Navigation

- TopBar: My courses, Progress, Settings. Inside a course: Breadcrumbs course / lesson, the lesson list beside the lesson on the desktop (as a ProgressStatus card), Previous · Next at the end of each lesson.
- Phone: the lesson list is a sheet opened from the TopBar; BottomBar Learn · Progress · Settings.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Take a lesson**

1. My courses: pick "Japanese for travellers"
2. Lesson: read or watch, Mark as Done; SavedState
3. Quiz: 5 questions (QuizQuestion), Check shows right or wrong and the explanation
4. Results: GaugeRing score; Toasts "Lesson 3 done"

**Learn the words**

1. Flashcards: today's due cards from the lesson's word list; Again or I Knew It
2. Flashcards: Done for today, the next due date

**Keep a streak**

1. Progress: HeatmapCalendar of days learned; KpiTile streak and minutes

**Teach a class**

1. Class (teacher): Invite learners by link
2. Class (teacher): DataTable of progress, BarChart by lesson

## Phone

- The video is full width; lesson text at 17 px; Previous · Next as a row of two buttons at the end. Quizzes show one question per screen.

## Data model

| Collection | Fields |
| --- | --- |
| `courses` | slug, title_en, title_ja, lessons[] (from `content/courses/<slug>/*.md`) |
| `lessons` | slug, title_en, title_ja, minutes, video, body, quiz[] ({question_en, question_ja, choices[], answer, why_en, why_ja}) |
| `progress` (store) | lesson_slug, done_at, quiz_score, attempts |
| `days` (store) | date, minutes |

No-server: `progress` and `days` in IndexedDB (`js/store.mjs`), exported with Save a Backup. Web: the same as tables with `user_id`.

## Capabilities and packages

Capabilities: **Works offline**, **Installs on a phone**, **Dashboard and charts**; for classes **Log in and accounts**, **Sharing and roles**, **Database**. Packages: **App with no server**; **Web app (full stack)** for classes.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Sakura Steps | さくらステップ |
| `nav.learn` | Learn | 学ぶ |
| `nav.progress` | Progress | 進捗 |
| `nav.settings` | Settings | 設定 |
| `lesson.previous` | Previous | 前へ |
| `lesson.next` | Next | 次へ |
| `lesson.mark_done` | Mark as Done | 完了にする |

## Adding to it

- Quizzes are **QuizQuestion** (single, multiple, short answer; explanation after Check); vocabulary is **Flashcards** (flip, Again / I Knew It, spaced repetition).
- A graded test keeps the right answers on the server (QuizQuestion's web path); practice quizzes may carry them in the page.
