# 317: App Blocks as cards Pi loads one at a time

Kind: code

Request 2026-10-18 (plan 266 item 7): "many app features: login, side panels, etc… ready for dumb agent to grab", "an
online shop, an admin dashboard, a portfolio, a notion clone… anything", "any 2d games". The designer delivered App Blocks
(design/app-blocks, round 12 part A); the rule: the model picks and parameterises, deterministic code generates and checks.

- [x] Red (unit): tests/test_app_blocks.py: the build is deterministic and the committed cards match a fresh build (a
  re-sync without a rebuild fails); every index entry's files exist at stable paths; every class the block markup uses
  is Basecoat 1.0.2, the kit's CSS or a Tailwind utility; the checker catches each listed mistake on fixtures and only
  the known design findings in the catalogue; add.py vendors Chart.js and Basecoat's chart wrapper with licences and
  merges texts, and running it twice changes nothing; the classifier picks among candidates and never asks the person.
- [x] Red (unit): tests/harness/blocks.test.mjs: EN and JA phrases pick the right card, a longer phrase wins, never more
  than two cards plus the foundation within the budget, weak or shared words give candidates only, the app_block tool
  refuses unknown names; tests/harness/extension.test.mjs: the card reaches the system prompt and decisions.jsonl.
- [x] Cards: kit/blocks/build.py writes kit/blocks/<group>/<Name>.md plus the markup as files (<Name>.html, .css, .js),
  index.json and texts.json from design/app-blocks/components/*/README.md; keywords.json holds the hand-written routing
  words. 137 cards (108 blocks, 11 archetypes, 13 genres, 4 art, 1 foundation), 287 files.
- [x] Vendoring: kit/blocks/add.py copies Basecoat's script (all.min.js), Chart.js 4.5.1 and Basecoat's chart wrapper
  (chart.min.js) with licences into static/vendor (web) or vendor (no server), and merges the cards' texts.
- [x] Routing: harness/blocks.mjs (code: keywords; the classifier, judgement app_block, only for weak or shared words;
  both logged in decisions.jsonl), the app_block tool (Gate: read_file), active only when a request matched a card.
- [x] Checker: kit/blocks/check.py (class, label, chart, colour and cdn errors; breakpoint and fixed warnings).
- [x] design/app-blocks is not installed (harness/install.py; tests/test_auto_update.py).
- [x] Docs: plan 266 item 7, docs/handoff/core-libraries.md, README, harness/GUIDE.md, kit/README.md, kit/cards/charts.md
  (the designer's Basecoat chart wrapper pattern), design/briefs/round-13.md (the designer's open items and the
  gaming-core naming check).
- [x] Green: python3 tests/verify_workflow.py; the browser suites (all).

Not done here: Gate's end of request does not run check.py on changed pages yet (gate/ is being changed by other round 12
work; `check.check_file` is ready to call); Project Start (plan 266 item 9) assembles starters from these cards.

## Texts with a placeholder that the markup does not show (design/briefs/round-13.md, part B)

- About: `about.title`, `about.update_ready`
- AccountSettings: `account.email.sent`, `account.sessions.ended`
- ActivityFeed: `activity.line.created`, `activity.line.commented`, `activity.line.deleted`, `activity.line.joined`
- Agenda: `agenda.day_label`, `agenda.duration_h`
- AvatarGroup: `people.away_label`, `people.busy_label`
- BlockEditor: `editor.no_match`
- BottomBar: `nav.count_unread`
- Breadcrumbs: `crumbs.back`
- CardHand: `cards.deck`, `cards.discard`, `cards.need_energy`
- Cart: `cart.quantity_of`, `cart.price_changed`, `cart.removed`
- Channels: `chat.typing_two`, `chat.unread`, `chat.empty`, `chat.join_hint`
- Checkout: `checkout.place`
- CodeDiff: `diff.stats`, `diff.large`
- ComboboxField: `combo.add`, `combo.remove`
- Comments: `comments.more`, `comments.replies_to`, `comments.show_more`, `comments.time.minutes`, `comments.time.hours`
- ControlsRemap: `controls.changed`, `controls.swapped`
- Coupons: `coupon.applied`, `coupon.remove_label`, `coupon.summary_line`, `coupon.error.unknown`, `coupon.error.ended`, `coupon.error.minimum`, `coupon.error.items`, `coupon.error.used`, `coupon.one_only`, `shop.ships_from`, `cart.price_changed`, `shop.off`, `shop.low_stock`, `shop.was`
- DataTable: `table.caption`, `table.sort_by`, `table.row_menu`, `table.select_row`, `table.selected`
- DatePicker: `date.month_title`, `date.error.range`
- DeleteAccount: `delete.done.body`, `delete.owner`
- DeleteUndo: `delete.row_label`, `delete.done_many`, `delete.done_text`
- DetailView: `detail.read_only`
- DocEditor: `doc.saved_at`, `doc.characters`
- DonutChart: `chart.payments.empty_title`
- DragList: `drag.moved`
- EditForm: `form.errors_title`, `error.title_long`
- EmailConfirm: `confirm.resend_wait`
- EmptyState: `empty.search_title`
- FileUpload: `upload.remove`, `upload.live.started`, `upload.live.done`, `upload.error.size`, `upload.error.count`
- ForgotPassword: `forgot.sent.wait`
- FunnelChart: `chart.funnel.empty_title`
- Gallery: `gallery.open`, `gallery.selected`
- GameOver: `gameover.floor`
- GaugeRing: `chart.goal.lede`
- GlobalSearch: `search.none`, `search.in`
- HeatmapCalendar: `chart.lessons.cell`
- Help: `help.no_match`
- HudPieces: `hud.new_objective`
- InfiniteScroll: `feed.loaded`
- InlineAlert: `alert.more`
- Invite: `invite.sent`, `invite.error.email`, `invite.error.already`, `invite.accept.title`
- IssueDetail: `issue.added_label`, `issue.closed_event`, `issue.mentioned_in`
- IssueList: `issues.closed_by`, `issues.comments`, `issues.filtered`, `issues.selected`
- Kanban: `board.add_to`, `board.card_menu`, `board.live.picked`, `board.live.dropped`, `board.live.moved_by`
- KpiTile: `kpi.change_up`, `kpi.change_down`
- LabelsAssignees: `labels.create_q`, `labels.create`, `labels.count`, `labels.delete_q`
- LevelSelect: `levels.unlock_hint`
- ListSearch: `list.no_match`, `list.updated`
- LogIn: `login.error.locked`
- LogOut: `logout.unsaved.body`
- MapScreen: `map.travel_confirm`
- Mentions: `mention.none`, `mention.invite_q`, `mention.notifies`
- Notifications: `notif.bell`, `notif.new`
- OfflineBanner: `offline.sync_failed`
- OrderConfirmation: `order.konbini_due`
- PageTree: `tree.open`, `tree.close`, `tree.deleted`
- PauseMenu: `pause.saved`
- Presence: `presence.button`, `presence.joined`, `presence.left`, `presence.typing_two`, `presence.more`
- ProductGrid: `shop.low_stock`, `shop.was`, `shop.empty`
- ProductPage: `shop.low_stock`, `shop.was`, `product.picture_n`
- Profile: `profile.saved`
- ProgressStatus: `progress.failed_title`, `progress.failed_body`, `progress.done`, `progress.cancelled`
- PullReview: `pr.comment_line`, `pr.merge_q`, `pr.conflicts`
- QuestLog: `quests.completed_on`
- Reactions: `react.count_mine`, `react.count`, `react.and_more`
- ResultsScores: `results.top_needed`
- Roles: `roles.changed`, `roles.remove.title`
- SaveSlots: `saves.overwrite`, `saves.delete_confirm`, `saves.saved`
- ScatterChart: `chart.study.first_n`
- ShopScreen: `shop.total`, `shop.bought`
- SidePanel: `nav.count_unread`
- StatusBadges: `status.low_stock`
- TagInput: `tags.duplicate`, `tags.added`, `tags.removed`
- Threads: `thread.new`, `thread.unread`
- TimePicker: `time.error.range`, `time.error.gone`
- Timeline: `timeline.more`, `timeline.expected`
- TitleScreen: `title.continue_detail`
- Toasts: `toast.invite_sent`
- TopBar: `top.notifications_new`
- TutorialPrompt: `tutorial.jump_sr`, `tutorial.hold`
- UpdateAvailable: `update.migrate.title`
