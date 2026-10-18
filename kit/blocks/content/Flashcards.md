# Flashcards

App Block card (Content). A deck studied one card at a time: see the front, flip to the back, then say whether you knew it, so cards you miss come back sooner.

- Basecoat: `card`, `btn`, `progress`, `badge`, `kbd`, `empty`
- Route: `/decks/{id}/study`
- Needs: Web: `GET /decks/{id}/due` (today's cards), `POST /reviews` (`card, result`). No server: `store.dueCards(deckId, today)`, `store.review(cardId, result)`.
- Links to: QuizQuestion, ProgressStatus, EmptyState (nothing due), ResultsScores-style summary, AppCourse, AppNotes

## Markup
Copy, never retype: `{harness}/kit/blocks/content/Flashcards.html` (27 lines of HTML).

Back of the card (replaces the button's content when flipped):

Copy, never retype: `{harness}/kit/blocks/content/Flashcards.2.html` (3 lines of HTML).

The end of a session and nothing due:

Copy, never retype: `{harness}/kit/blocks/content/Flashcards.3.html` (13 lines of HTML).

## States
- Front (default): As above; `#fc-answer` hidden.
- Flipped: `#fc-card` gets `aria-pressed="true"` and the back content; `#fc-answer` shows; focus moves to **I Knew It**. With motion allowed, a 200 ms fade (no 3D flip under `prefers-reduced-motion`).
- Answered: The next card loads on its front; `#fc-live` (the live region) says `fc.live.next`. **Again** puts the card back into today's queue (after 3 more cards); **I Knew It** schedules it later (1, 3, 7, 14, 30 days: the next step each time).
- Last card: A summary card: `fc.done.title`, `fc.done.body` (`{known}`, `{again}`), **Study Again** (only the Again cards) and **Back to Deck**.
- Nothing due: EmptyState: `fc.none.title`, `fc.none.body` with `{date}` of the next due card, **Study Anyway** (all cards, not counted).
- Saving fails: The card still moves on; the result waits in the store and a quiet line says `fc.error.sync` until it is sent.
- Loading: A `skeleton min-h-56` card.

## Texts
(Key | English | 日本語)
- `fc.deck`: Week 3 · Vocabulary | 第3週・単語
- `fc.position`: Card {n} of {total} | {total}枚中{n}枚目
- `fc.progress`: Cards studied | 学習したカード
- `fc.due_new`: {n} new | 新規 {n}
- `fc.due_review`: {n} to review | 復習 {n}
- `fc.front`: Front | おもて
- `fc.back`: Back | うら
- `fc.meaning`: station | 駅（station）
- `fc.flip_help`: Press Space or tap the card to see the answer. | スペースキーを押すか、カードをタップすると答えが表示されます。
- `fc.again`: Again | もう一度
- `fc.know`: I Knew It | 覚えた
- `fc.live.next`: Card {n} of {total}. | {total}枚中{n}枚目。
- `fc.done.title`: Done for today | 今日の学習は完了です
- `fc.done.body`: You knew {known} and will see {again} again soon. | {known}枚覚えていて、{again}枚はもう一度出題されます。
- `fc.study_again`: Study Again | もう一度学習
- `fc.back_to_deck`: Back to Deck | デッキに戻る
- `fc.none.title`: Nothing to review today | 今日復習するカードはありません
- `fc.none.body`: The next cards are due on {date}. | 次のカードは{date}に出題されます。
- `fc.study_anyway`: Study Anyway | それでも学習する
- `fc.error.sync`: Your answers are saved on this device and will be sent when you’re online. | 回答はこのデバイスに保存され、オンラインになると送信されます。

## Keyboard and focus
1. the card (Space or Return flips it) → 2. Again → 3. I Knew It.
- Shortcuts while studying: Space flips, 1 = Again, 2 = I Knew It (only after flipping), Esc leaves to the deck.
- After answering, focus goes back to the new card.

## Phone
- The card is the full width and at least 14rem tall; tapping it flips it.
- **Again** and **I Knew It** sit side by side under the card, 44 px tall; the `kbd` hints are hidden below 48rem.
- Swiping left (Again) or right (I Knew It) on the flipped card does the same as the buttons.

## Data
```json
{"deck": {"id": 7, "title": "Week 3 · Vocabulary"},
 "due": [{"id": 101, "front": "駅", "back": "えき", "meaning": {"en": "station", "ja": "駅（station）"},
          "new": false, "step": 2, "due": "2026-10-18"}],
 "review": {"card": 101, "result": "know | again", "at": "2026-10-18T09:12:00+09:00"}}
```

- Steps: `step` 0 → 1 day, 1 → 3, 2 → 7, 3 → 14, 4+ → 30. **Again** sets `step` to 0 and due today.
- Web: `POST /reviews` → 204; the queue is kept in the page. No server: `store.review(101, 'know')` updates `step` and `due`.

## Don't
- Don't show the answer buttons before the card is flipped.
- Don't animate a 3D flip when the person prefers reduced motion.
- Don't add more than two answer buttons unless the course asks for graded answers.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Flashcards` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
