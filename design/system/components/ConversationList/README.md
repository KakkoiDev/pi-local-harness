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

## Round 18 addendum (settled or superseded in round 19 — see Round 19)

Nothing here is decided. Revised 21 Oct after review. Boards: R18A_AskDraft, R18A_AskDelete, R18A_AskRevoked, R18A_AskNew, Ph18A_AskDraft, Ph18A_AskDelete, R18A_AskStrings, R18A_AskWalk. CSS: `scripts/round18add_b.css` (`.pw-askkept`, `.pw-draftver*`, `.pw-askmore`, `.pw-convorow*`).

Superseded (round 19, see Round 19): **Q3 · Shared drafts; conflicting versions kept until explicitly resolved (Recommended).** A draft belongs to its conversation and to the person, saved by Pi WorkStation 1 s after typing stops (reloads, windows, phone). When the draft was also changed elsewhere and this window types or focuses Question, the notice `div.pw-asknotice[role=group]` reads “This draft was also changed in another window at 14:52. Both versions are kept until you choose.” with **Use This Version** (focused) · **Use Other Version** · **Show Both**. Question is read-only until a choice; the triggering keystroke is not applied; Escape closes the notice without choosing (it returns on the next focus). **Show Both** lists `div.pw-draftver` “This window · 14:40” and “Other window · 14:52”, each with its own Use button. After a choice: `p.pw-askkept[role=status]` “Other version kept” + **Discard Other Version…**, which asks “Discard the other draft version?” **Cancel** (default) · **Discard**. Sending sends what is in the field and still keeps the other version until discarded. Never merged or discarded automatically. JA: この下書きは 14:52 に別のウインドウでも変更されました。どちらかを選ぶまで両方を残します。 / この版を使う / もう一方の版を使う / 両方を表示 / もう一方の版を残しています / もう一方の版を破棄… / もう一方の下書きの版を破棄しますか？ · キャンセル · 破棄. Phone: buttons stacked at 44 px.
- Would supersede (round 18): “drawn: last edit wins when the other window is not focused”. The first addendum proposal (Use Newer Draft / Keep This Version, “Earlier draft kept · Restore”, kept once) is dropped.
- Not chosen (round 19): drafts stay on each device only, “Drafts aren't shared between devices.” (下書きはデバイス間で共有されません。).

**Q4 · Generated title hidden (Recommended).** When an answer is withheld because access to a project it used ended, the conversation's generated title is replaced by “Conversation · 20 Oct 14:31” (会話 · 10月20日 14:31) in the popup button, the history list and the phone. The person's own questions stay as written. See SourceList for the answer.

Superseded (round 19, see Round 19): **Delete Conversation (new, Recommended).** In the pane head's ⋯ (`span.pw-askmore` › `button[aria-label="More for this conversation"]`) and on each history item (`div.pw-convorow` › `button.pw-convorow__more[role=menuitem][aria-haspopup=menu][aria-label="More for {title}"]`; keyboard: → from the item opens it, ← or Escape returns). Item **Delete Conversation…** (会話を削除…). Alert: “Delete “Offline sync across apps”?” / “It moves to the Trash with its messages and what Pi used for each. You can restore it from the Trash.” / **Cancel** (default) · **Move to Trash** (「Offline sync across apps」を削除しますか？ / メッセージと、それぞれで Pi が使ったものと一緒にゴミ箱に移動します。ゴミ箱から元に戻せます。 / キャンセル / ゴミ箱に移動). Then the pane shows the next newest conversation (or a New conversation, “Searching all projects (5)”), focus in Question, and a toast “Conversation moved to the Trash.” + **Undo** (⌘Z) (会話をゴミ箱に移動しました。 / 取り消す). Its drafts move with it; no project changes. The Trash itself is not drawn.

**Q6 · New Conversation without a shortcut (Recommended, unchanged).** ⌃⌥N stays New File… everywhere; New and the popup's first item carry no key text or `aria-keyshortcuts`; path ⌃⌥0, then Tab. Not chosen (round 19): ⌃⌥N in the Ask pane only (“New Conversation ⌃⌥N (in Ask)”).

Data still missing (✱): per-person draft versions `{conversation_id, versions:[{text, saved_at, window_id}]}` until resolved; a conversation Trash record (deleted_at, restorable) holding messages, drafts and per-answer sources/coverage; a `title_hidden` flag tied to Q4.


## Round 19 (decided, owner-delegated 21 Oct 2026)

Brief: design/briefs/round-19-final-integration.md (A3, A4, A6, A9). Design only; nothing here is implemented. Boards: R19_AskActions, R19_AskTrash, R19_AskDrafts, R19_AskRevoked, Ph19_AskActions, Ph19_AskTrash, R19_AskStrings, R19_AskWalk. CSS: `scripts/round19_b.css` (`.pw-convoact*`, `.pw-convoline`, `.pw-convo__trash`).

- **Conversation actions (A6).** `span.pw-convoact` › `button.pw-convoact__btn[aria-haspopup=menu][aria-label="Conversation actions"]` sits beside the conversation title (`div.pw-convoline` holds the title popup and it). Items: **New Conversation**, **Delete Conversation…** (project chat adds **Earlier Conversations…**; worker C). Each history row keeps its own ⋯ (→ opens, ← / Escape returns) with **Delete Conversation…**. Never in the Agent menu or the phone view (Chat ▾) menu (round 9). Phone: ⋯ opens a “Conversation actions” sheet. New Conversation has no shortcut; New File keeps ⌃⌥N. The round 18 **New** button stays.
- **History list ends with Trash** (`button.pw-convo__trash`, item count) → ConversationTrash.
- **Delete (A9).** Alert “Delete “{title}”?” / “It moves to the Trash with its messages, what Pi used for each and its draft versions. You can restore it from the Trash.” / **Cancel** (default) · **Move to Trash**. Refused while a request runs or is queued: “This conversation has a request running or queued. Stop or cancel it first.” + **Show Request** · **OK** (no implicit cancel). Toast “Conversation moved to the Trash.” + **Undo**; the next newest conversation opens (or a New conversation, “Searching all projects (5)”); focus to Question.
- **Neutral titles (A4).** A conversation with an answer withheld because access ended is titled “Conversation · 20 Oct 14:31” everywhere (button, history list, Trash, phone).
- **Drafts (A3)** use DraftVersions; the history row's “Draft” tag means the conversation has at least one draft version.
- States: idle/loading (list loads with the pane)/empty (only New Conversation and Trash)/error (Not applicable — the list is part of the pane load)/disabled (Delete refused while active)/stale (rows update in place, focus kept)/conflict (Not applicable — conversations don't conflict; drafts do).
- JA: 会話の操作 / 新しい会話 / 会話を削除… / ゴミ箱 / 「{title}」を削除しますか？ / キャンセル / ゴミ箱に移動 / 会話をゴミ箱に移動しました。 / 取り消す.

### Follow-up decisions (21 Oct)

Decision record: design/briefs/round-19-follow-up-decisions.md (1, 3, 12). Boards: R19_AskUnsaved, R19_AskRemote, R19_AskRemoved.

- **Switching with unsaved text (1).** Choosing another conversation in the popup keeps this conversation's Unsaved text in the window's memory; returning shows it as Unsaved with the help line. Closing or reloading the page triggers only the browser's own leave-page warning (best effort).
- **Deleted elsewhere (3).** If the open conversation is moved to the Trash in another window, the pane switches to ConversationTrash's read-only detail (not to the next conversation, as it does after your own delete), so unsaved text is visibly kept. The history list drops the row; Trash's count increases.
- **Theme (12).** Selected rows in the popup use the wrapper's own ink/paper in dark and light wrappers.
- Phone title row (decision 7) is worker C's (Message card) and reuses the “Conversation actions” anatomy above unchanged.
