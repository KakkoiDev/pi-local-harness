# QuizQuestion

App Block card (Content). One quiz question at a time, single choice, multiple choice or a short typed answer, with Check, the explanation, and the running score.

- Basecoat: `card`, `fieldset`, `label`, `input` (radio, checkbox, text), `btn`, `progress`, `alert`, `badge`
- Route: `/courses/{course}/quiz/{lesson}?q=3`
- Needs: Web: `GET /quiz/{lesson}` (the questions), `POST /quiz/{lesson}/answers` (one answer, returns right or wrong and the explanation). No server: `store.quiz(lesson)`, `store.saveAnswer(lesson, questionId, answer)`; the right answers are in the quiz data.
- Links to: Flashcards, ProgressStatus, ResultsScores (the end), Stepper, AppCourse

## Markup
Copy, never retype: `{harness}/kit/blocks/content/QuizQuestion.html` (24 lines of HTML).

Other kinds, same card:

Copy, never retype: `{harness}/kit/blocks/content/QuizQuestion.2.html` (9 lines of HTML).

Feedback after Check (the `#quiz-feedback` alert, filled):

Copy, never retype: `{harness}/kit/blocks/content/QuizQuestion.3.html` (9 lines of HTML).

## States
- Unanswered: **Check** is enabled; pressing it with nothing chosen shows `quiz.error.empty` under the hint in `text-destructive` and focuses the first choice.
- Right: `#quiz-feedback` loses `hidden`, gets `<h3>` `quiz.right` and the explanation `section`; the chosen row gets `border-success bg-success/10` and a ✓ (`aria-label` `quiz.right`). Inputs are `disabled`. **Check** becomes **Next Question** (`quiz.next`); score +1.
- Wrong: `#quiz-feedback` gets `data-variant="destructive"`, `quiz.wrong` and the explanation; the chosen row `border-destructive`, the right row `border-success bg-success/10` with `quiz.right_answer` beside it. **Next Question**.
- Partly right (multiple): `quiz.partly` with `{right}` of `{total}`; counts 0 points unless the quiz allows partial credit (`partial: true` adds right/total).
- Short answer: Compared after trimming spaces and full-width/half-width folding (`NFKC`); accepted spellings come from `accept[]`. Wrong shows the expected answer.
- Last question: **Next Question** reads **See Results** (`quiz.results`) and goes to ResultsScores.
- Skipped: Counts as wrong; the next question loads.
- Loading / error: `skeleton` rows; ErrorRetry inside the card on failure.

## Texts
(Key | English | 日本語)
- `quiz.position`: Question {n} of {total} | 第{n}問／全{total}問
- `quiz.score`: Score {score} | 得点 {score}
- `quiz.progress`: Quiz progress | クイズの進み具合
- `quiz.prompt`: Which word means “station”? | 「station」を意味する言葉はどれですか？
- `quiz.choices`: Answers | 回答
- `quiz.pick_one`: Choose one. | 1つ選んでください。
- `quiz.pick_many`: Choose all that are right. | 正しいものをすべて選んでください。
- `quiz.type_answer`: Type your answer | 答えを入力
- `quiz.skip`: Skip | スキップ
- `quiz.check`: Check | 答え合わせ
- `quiz.next`: Next Question | 次の問題
- `quiz.results`: See Results | 結果を見る
- `quiz.right`: Right | 正解
- `quiz.wrong`: Not quite | 不正解
- `quiz.partly`: {right} of {total} right | {total}個中{right}個正解
- `quiz.right_answer`: Right answer | 正しい答え
- `quiz.error.empty`: Choose an answer, or press Skip. | 答えを選ぶか、スキップを押してください。

## Keyboard and focus
1. the choices (radios: one stop with ↑ ↓; checkboxes: each) → 2. Skip → 3. Check.
- Return checks; after checking, focus moves to `#quiz-feedback` (it has `tabindex="-1"`), then Tab reaches **Next Question**; Return on it loads the next question and focus goes to its prompt.
- Number keys 1–9 choose that answer when focus is in the choices.

## Phone
- The card fills the width; choice rows are full-width 44 px+ targets (the whole label is pressable).
- **Check** stays at the end of the card; nothing is fixed to the bottom.

## Data
```json
{"lesson": 3, "questions": [
  {"id": "q3", "kind": "single", "prompt": {"en": "Which word means “station”?", "ja": "「station」を意味する言葉はどれですか？"},
   "choices": [{"id": "a", "text": "駅（えき）"}, {"id": "b", "text": "電車（でんしゃ）"}, {"id": "c", "text": "切符（きっぷ）"}],
   "right": ["a"], "explain": {"en": "駅 (eki) is a station; 電車 is a train.", "ja": "駅は station、電車は train です。"}},
  {"id": "q4", "kind": "text", "prompt": {"en": "Write “ticket” in hiragana.", "ja": "「ticket」をひらがなで書いてください。"}, "accept": ["きっぷ"]}],
 "partial": false}
```

- Web: `POST /quiz/3/answers` (`question=q3&answer=a`) → the feedback fragment and the new score; the server keeps the right answers.
- No server: the right answers are in the data; that is fine for practice, not for graded tests.

## Don't
- Don't reveal the right answer before Check.
- Don't use colour alone for right and wrong: the ✓ and the words say it.
- Don't add timers unless the lesson asks for one.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> QuizQuestion` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
