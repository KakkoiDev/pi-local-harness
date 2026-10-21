# ConversationList

**Existing vs Proposed.** Existing: nothing. Round 17 drew one current Overview conversation plus a **New** button, and old conversations were not listed. Proposed (round 18, decisions 8 and 9): the Ask pane's head gets a popup button that names the current conversation (“Offline sync across apps ▾”). It opens a menu with **New Conversation** (⌃⌥N in the pane) first, then every dashboard conversation, newest first, each “title · scope · date”. Each conversation keeps its own scope and its own unsent draft. This is design only; no conversation store ships.

Decisions: docs/plans/360-round-17-product-decisions.md, 8 (new conversation = all authorized projects, stated), 9 (keep and list, with New), 13 and 16 (Ask About / Ask in Overview reuse or start one). Boards: R18_AskHistory, R18_AskConversations, R18_AskPrefill, R18_AskAbout, R18_Ask1024, R18_AskNarrow, Ph18_AskHistory, Ph18_AskDraft, R18_AskStrings, R18_AskWalk. CSS: `scripts/round18_b.css` (`.pw-convo*`, `.pw-asknotice*`). Scope inside a conversation: SearchScope. Project chats are not listed here; they stay project-only.

## Anatomy

- **Button.** `div.pw-convo` › `button.pw-convo__btn#ask-convo[aria-haspopup="menu"][aria-expanded][aria-controls="ask-convo-menu"][aria-label="Conversation: {title}"]`: a speech glyph, the title (one line, truncated; the full title is in the accessible name), ▾. It sits in `.pw-ask__head` on its own row, between the pane title row (“Ask across projects” + **New**) and the scope button.
- **New.** The head keeps the small **New** button (round 17); its accessible name is now “New Conversation”, `aria-keyshortcuts="Control+Alt+N"`.
- **Menu.** `div.pw-convo__pop[role="menu"]#ask-convo-menu[aria-label="Conversations"]`, as wide as the head:
  - `button.pw-convo__new[role="menuitem"]` **New Conversation** with `⌃⌥N` on the right;
  - `p.pw-convo__h` “Conversations · newest first” (`aria-hidden`; the group below carries the name);
  - `div[role="group"][aria-label="Conversations, newest first"]` of `button.pw-convo__item[role="menuitemradio"][aria-checked]`, each `span.pw-convo__t` (title) + `span.pw-convo__m` (“{scope} · {date}”, plus `span.pw-convo__draft` “Draft” when it holds an unsent draft). The current one has ✓.
- **Draft-conflict notice.** `div.pw-asknotice[role="group"][aria-labelledby="ask-conflict-t"]` at the top of `form.pw-ask__foot`, above the read-only line: `p.pw-asknotice__t#ask-conflict-t` “This conversation already has an unsent draft.” + `.pw-asknotice__actions` › **Keep My Draft** (default, focused) and **Replace with New Question**.

## Rules (exact)

| Situation | Result |
| --- | --- |
| New Conversation (menu, New, ⌃⌥N) | Title “New conversation”, scope “Searching all projects (5)” — never the previous conversation's narrowed scope. Focus in Question. Listed once something is typed or sent. |
| Switching | The chosen conversation's messages, scope and draft come back exactly; nothing moves between conversations. |
| Ask About {project} / Ask in Overview, current conversation has no messages and no draft | Reused: Ask About sets its scope to “Searching {project} only”; Ask in Overview fills Question and sets “Searching all projects (5)”. |
| … current conversation has messages | A new conversation with that prefill. |
| … current conversation is empty but holds a draft | The notice. **Keep My Draft** (default; Escape) keeps that draft and scope and opens another new conversation with the prefill. **Replace with New Question** clears that draft and applies the prefill there. |
| Always | Nothing sends automatically. No receipt exists for a draft. |
| A project registered after the conversation started | Not added: the scope reads “Searching 5 of 6 projects”; the popup lists the new project unchecked with “Added after this conversation started. Check it to search it here too.” |
| A project the person can no longer open | Dropped from the item's scope text, the scope button, the popup and every count, with no trace (“Class Notes, Kanji Cards” → “Class Notes”). |
| No project of the conversation is left | Scope button “Choose projects to search”; Send disabled, described by “None of this conversation's projects can be searched now. Choose projects, or start a New Conversation.” The draft is kept. |

## Texts (EN / JA)

| English | 日本語 |
| --- | --- |
| New Conversation | 新しい会話 |
| New conversation (empty conversation's title) | 新しい会話 |
| Conversation: {title} | 会話: {title} |
| Conversations · newest first | 会話 · 新しい順 |
| All projects ({n}) | すべてのプロジェクト（{n}） |
| Today {time} · Yesterday {time} | 今日 {time} · 昨日 {time} |
| Draft | 下書き |
| This conversation already has an unsent draft. | この会話には未送信の下書きがあります。 |
| Keep My Draft | 下書きを残す |
| Replace with New Question | 新しい質問に置き換える |
| Choose projects to search | 検索するプロジェクトを選択 |
| None of this conversation's projects can be searched now. Choose projects, or start a New Conversation. | この会話のプロジェクトは現在どれも検索できません。プロジェクトを選ぶか、新しい会話を始めてください。 |

## Data (✱ = does not exist yet)

```json
{"conversations": [{"id": "ov-12", "title": "Offline sync across apps", "scope": {"projects": ["prj_classnotes", "prj_pong", "prj_kanji", "prj_notes", "prj_home"], "all_at_start": true},
  "updated_at": "2026-10-20T14:32", "message_count": 2, "draft": {"text": "", "updated_at": null}}]}
```

- ✱ A server-side list of dashboard conversations per person, newest first by last activity; ✱ a per-conversation scope stored as explicit project ids; ✱ a per-conversation draft (see the notes' open issue on where drafts live).
- ✱ Title: “New conversation” until the first answer; then a short title for the conversation (who writes it is not decided; never the raw question cut mid-word).
- Labels are resolved at display time against the person's currently authorized projects; ids the person can't open are dropped before anything is drawn or counted. The list never grants access to a removed or revoked project's sources (decision 9).
- No retention policy is set here: the list keeps what the store keeps.

## Focus, keyboard, live

- Space, Return or ↓ opens the menu with the current conversation active; ↑↓ move; Return switches (or runs New Conversation); Escape closes; focus returns to the button.
- After switching or New, focus goes to Question (caret at the end of the draft).
- ⌃⌥N works while focus is anywhere in the Ask pane, including Question (it inserts no character). Outside the pane ⌃⌥N stays New File. Return/⌘Return in Question keep their send meaning; ⌘/Ctrl+Return never opens a window from the Ask pane.
- The notice: focus moves to Keep My Draft; Tab reaches Replace with New Question; Escape = Keep My Draft.
- Polite announcements: switching “{title} · {scope label} · draft kept” (draft part only when there is one); New “New conversation · Searching all projects (5)”; Keep “Draft kept · New conversation · Searching {project} only”. The notice itself is not announced (focus moves to it).
- A live update in another window never moves focus or scroll here. The current conversation is per window; drafts belong to the conversation.

## Phone

The button fills the first row under the bar (44 px) with **New** beside it; the scope button is the second row. Pressing it opens a **Conversations** sheet: New Conversation first, then the conversations (two lines, ≥44 px), ✓ on the current. The notice stacks its two buttons at 44 px above the composer.

## Don't

- Don't start a new conversation with a narrowed scope, or leave “all” implicit: the button always says it.
- Don't move or merge a draft between conversations, and don't discard one without **Replace with New Question**.
- Don't send anything on Ask About, Ask in Overview, Keep or Replace.
- Don't list, name or count a project the person can't open, in titles' scope text, the scope button or counts.
- Don't list project chats here.

## Walkthrough (Given / When / Then)

1. Given “Conflicts in two apps” (2 projects, a draft) and “Offline sync across apps” (all). When I press “Conversation: Offline sync across apps” and choose “Conflicts in two apps”. Then the scope reads “Searching 2 projects” and Question holds the draft with focus.
2. Given that conversation. When I press ⌃⌥N. Then the title reads “New conversation” and the scope “Searching all projects (5)”.
3. Given an empty conversation with the draft “Which projects still use Python 3.11?”. When I press “Ask About Class Notes”. Then “This conversation already has an unsent draft.” shows with focus on “Keep My Draft”; pressing it opens another new conversation scoped to Class Notes and the list shows the first with “Draft”.
4. Given the same notice. When I press “Replace with New Question”. Then the draft is gone, the scope reads “Searching Class Notes only”, and nothing was sent.
5. Given two windows. When I switch conversations in one. Then the other keeps its own current conversation.
6. Given a reload. Then the same conversation is current, and every scope and draft is as before.

## Round 18 addendum (proposed, awaiting approval)

Nothing here is decided. Boards: R18A_AskDraft, R18A_AskNew, Ph18A_AskDraft, R18A_AskStrings, R18A_AskWalk. CSS: `scripts/round18add_b.css` (`.pw-askkept`).

**Q3 · Shared drafts (Recommended).** A draft belongs to its conversation and to the person, saved by Pi WorkStation 1 s after typing stops, so it follows reloads, windows and the phone. When this window's draft is behind a newer save from elsewhere and the person types or focuses Question, the notice `div.pw-asknotice[role=group][aria-labelledby=ask-dchg-t]` appears above the composer: “This draft changed in another window at 14:52.” + **Use Newer Draft** (default, focused, Return) + **Keep This Version** (Escape). Question is `readonly` until a choice, and the keystroke that triggered the notice is not applied. The version not chosen is kept once: `p.pw-askkept[role=status]` “Earlier draft kept · **Restore**” (Restore swaps the two) until the next Send. Text is never merged; nothing is sent. Announcement: “Using the draft from 14:52 · earlier draft kept”. Phone: the two buttons stack at 44 px. JA: この下書きは 14:52 に別のウインドウで変更されました。 / 新しい下書きを使う / この版を残す / 前の下書きを保持 · 元に戻す.
- Would supersede (round 18): “Draft store per conversation … open issue 2 (drawn: last edit wins when the other window is not focused)” → the saved-per-person rule above with the notice.
- Alternative (not recommended): drafts stay on each device only; a help line under the read-only line, “Drafts aren't shared between devices.” (下書きはデバイス間で共有されません。); no notice; two windows on one device still need last-edit-wins.

**Q6 · New Conversation without a shortcut (Recommended).** ⌃⌥N stays **New File…** everywhere (round 13). The head's **New** keeps the accessible name “New Conversation” with no `aria-keyshortcuts`; the popup's first item `button.pw-convo__new` reads “New Conversation” with no key text. Keyboard path: ⌃⌥0, then Tab to New (or to the conversation popup, first item). ⌃⌥N in the Ask pane does nothing and types nothing; Overview's File › New File… is disabled with “Open a project to add a file.” (worker A).
- Would supersede (round 18): “New Conversation ⌃⌥N … ⌃⌥N works while focus is anywhere in the Ask pane” → no shortcut.
- Alternative (not recommended): the round 18 drawing (⌃⌥N in the Ask pane only), shown in the menu as “New Conversation ⌃⌥N (in Ask)”.

Data still missing (✱): a per-person draft record `{conversation_id, text, saved_at, saved_by_window}` and a “newer than mine” signal to each open window; the one kept earlier version.
