# App Blocks

Ready-made parts for the apps and games people build with Pi Workbench: copy a block, fill its texts, wire its data, and nothing has to be invented.

App Blocks is for the **apps Pi builds**, not for the workbench (the workbench keeps its own 1-bit design, Pi Workbench System 1). Apps use **Basecoat 1.0.2** (vega style, the kit's vendored copy in `kit/vendor/basecoat-1.0.2/`) on Tailwind v4.3.3, htmx 4 for the web starter, plain ES modules for the no-server starter, and **gaming-core** (LittleJS 1.27.0) for games. Everything is local: no CDN, no remote fonts.

## How a model uses it

1. Read **AppFoundations** once: the app root and its one breakpoint, 44 px phone targets, dark mode, the text keys, chart colours, and the Basecoat details that trip a small model.
2. For a whole app or game, start from its card in **Apps** or **Games**: it lists the screens, which block each screen uses, the journeys, and the phone version.
3. For each screen, open the named blocks and copy their **Markup**. Add every key from **Texts** to `messages/en.json` and `messages/ja.json`. Handle every row of **States**. Wire **Data** (an htmx endpoint on the web starter, a store function on the no-server starter).
4. Don't add anything a card says not to (each card ends with **Don't**). If a screen needs something no card has, it is a new block: write it in the same form.

## Every block page has the same form

| Section | What it holds |
| --- | --- |
| Summary and facts | one sentence; group, Basecoat classes used, route, what it needs, the blocks it links to |
| Markup | the complete, copyable HTML: real ids, ARIA, a `data-t` key on every text |
| States | empty, loading, error with retry, success, disabled, offline, overflow… and exactly what changes |
| Texts | every key in English and Japanese |
| Keyboard and focus | the Tab order, the keys, where focus goes |
| Phone | what changes below 48 rem; a button for every gesture |
| Data | the JSON it shows or sends; the web and no-server wiring |
| Don't | what a small model is tempted to invent |

Each preview shows the block on a **desktop in English** and a **phone in Japanese**, then its main states; switch the page's theme to see dark.

## The catalogue (137 cards)

| Group | Cards |
| --- | --- |
| Foundations | AppFoundations |
| Accounts | SignUp, LogIn, LogOut, ForgotPassword, EmailConfirm, Profile, AccountSettings, DeleteAccount |
| Navigation | SidePanel, TopBar, Tabs, Breadcrumbs, BottomBar, CommandPalette |
| Data | ListSearch, DataTable, DetailView, EditForm, EmptyState, LoadingState, ErrorRetry, DeleteUndo |
| Feedback | Toasts, InlineAlert, ConfirmDialog, ProgressStatus, OfflineBanner, SavedState |
| Content | Dashboard, Agenda, Kanban, DocEditor, FileUpload, Gallery, Comments, Notifications |
| App shell | Onboarding, SettingsPage, About, InstallApp, UpdateAvailable, Help |
| Sharing and people | Invite, Roles, ActivityFeed, Presence |
| Charts | LineChart, AreaChart, BarChart, DonutChart, ScatterChart, Sparkline, GaugeRing, HeatmapCalendar, FunnelChart, KpiTile |
| Commerce | ProductGrid, ProductPage, Cart, Checkout, OrderConfirmation, OrderHistory, Coupons |
| Collaboration | BlockEditor, PageTree, Mentions, Reactions, Threads, Channels, CodeDiff, IssueList, IssueDetail, PullReview, LabelsAssignees, GlobalSearch |
| Other elements | DatePicker, TimePicker, ComboboxField, TagInput, FileTree, Stepper, Timeline, MapPlaceholder, AvatarGroup, StatusBadges, Skeletons, InfiniteScroll, DragList, ShortcutHelp |
| Game blocks | GameKit, TitleScreen, PauseMenu, GameSettings, ControlsRemap, HudPieces, DialogueBox, InventoryGrid, Equipment, ShopScreen, QuestLog, MapScreen, SaveSlots, LevelSelect, ResultsScores, GameOver, TutorialPrompt, CardHand, TouchControls |
| Apps | AppShop, AppAdmin, AppPortfolio, AppNotes, AppChat, AppCode, AppBooking, AppForum, AppCourse, AppCrm, AppBoard |
| Games | GameRpg, GameShooter, GameCozy, GameRoguelike, GameCards, GamePlatformer, GamePuzzle, GameTowerDefence, GameRacing, GameArcade, GameVisualNovel, GameIdle, GameTactics |
| Art | ArtPalettes, ArtSprites, ArtFrames, ArtReferenceSet |

Apps and games name their blocks by these exact names, so a new archetype (a recipe app, a game launcher) is added the same way: list its screens, give each screen its blocks, write the journeys. Blocks the archetypes asked for that don't exist yet are listed under each card's **Adding to it**: Reviews, ShippingRates, ExportCsv, ArticleBody, DatabaseView, MessageComposer, RunStatus, CodeView, WeekCalendar, ReportContent, QuizQuestion, Flashcards, CsvImport, WipLimit.

## Decisions in this catalogue

- **One breakpoint, on a container.** `.app` is a container; blocks use `@3xl:` (48 rem) for the desktop layout and `@max-3xl:` for phone-only, never viewport breakpoints. A block then looks right wherever it is placed, and the previews can show the phone layout beside the desktop one. Dialogs (top layer) and Basecoat's own sidebar are the two exceptions; AppFoundations says how.
- **Charts: Chart.js 4.5.1, vendored** (your decision this round), drawn through Basecoat's own chart wrapper (`basecoat.chart()`), so tooltips and legends use Basecoat's `chart-tooltip` and `chart-legend` styles. Gauge, funnel and sparkline are Chart.js doughnut, horizontal bar and bare line; the heatmap is a CSS grid. Every chart has a table alternative.
- **Chart colours** are colour-blind-safe (Okabe–Ito: blue, orange, bluish green, reddish purple, vermilion), different in lightness too, replacing Basecoat's default blue ramp. They are for marks, not backgrounds behind text.
- **Texts**: `data-t` for an element's text; `data-t-label`, `data-t-placeholder`, `data-t-title`, `data-t-empty` for attributes; `data-t-line` for a sentence with elements inside. The web starter writes `{{ t("key") }}` in the same places.
- **Games** draw the world on the LittleJS canvas and put words and controls in HTML over it (the game kit, `styles/game.css`, in GameKit), so menus get focus, screen readers and Japanese. Prompts follow the device in use (keyboard, mouse, gamepad, touch); gamepad buttons are named by position (south, east, west, north), never by a console brand.
- **Art direction** (ArtPalettes, ArtSprites, ArtFrames, ArtReferenceSet) gives visual-core's generators a target: four named palettes (Meadow is the game kit's default), 16/32/64 px sprites with one light from the top left, outline and shading rules, pixel and vector frames and icons, and a reference hero, monster, item, tile, icon and button in each style.

## Files

- `components/bundle.css`: Basecoat 1.0.2 (vega) compiled with Tailwind v4, the App foundations rules and the game kit, for the previews. An app compiles its own from `styles/input.css`.
- `components/lib/`: `chart.umd.min.js` (Chart.js 4.5.1, MIT), `basecoat.all.min.js` and `basecoat.chart.min.js` (Basecoat 1.0.2, MIT), with their licences. These are the files a project vendors.
- The game previews load the Silkscreen and DotGothic16 fonts from Google Fonts for the catalogue only; a game vendors them (both OFL) or falls back to the system faces named in GameKit.

## Known limits

- A native `<input type="date">` shows the browser's own date format, so a Japanese page on an English browser shows 10/14/2026; DatePicker's calendar popover is the way to force 年月日.
- Some attribute labels built from data (“Sort by {column}”, “Quantity of {name}”) are listed as keys in their card's Texts table but not yet marked with `data-t-label` in the markup.
- Previews of open menus, popovers and dialogs draw the open panel in place; in an app they float as Basecoat places them.
