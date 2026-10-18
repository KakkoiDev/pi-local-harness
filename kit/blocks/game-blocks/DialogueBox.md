# DialogueBox

App Block card (Game blocks). A character speaks at the bottom of the screen with a portrait, the text appearing letter by letter, and up to four choices.

- Basecoat: none (game kit: `game-dialogue`, `game-panel`, `game-portrait`, `game-speaker`, `game-line`, `game-menu`, `game-btn`)
- Needs: GameKit; a dialogue script (Data); portraits from visual-core (64 × 64 px at 1 art pixel = `--g-px`)
- Used in: GameRpg, GameCozy, GameVisualNovel, TutorialPrompt (longer explanations)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/DialogueBox.html` (16 lines of HTML).

The `.game-panel` on a light tone keeps dark text on paper. The speaker's name takes the colour of their portrait's main colour only when that colour has 4.5 : 1 on the paper; otherwise `--g-ink`.

## States
- Typing: Letters appear at 40 per second (Japanese: 25 per second); confirm shows the whole line at once; a second confirm goes on. Reduce Motion: whole lines at once.
- Line done, more to say: A ▼ marker blinks at the end of the line; no choices.
- Choices: Shown only after the line is complete; the first is focused; numbers 1–4 choose directly.
- No portrait: The portrait is removed; the panel takes the full width.
- Narration: No speaker, no portrait; the line is italic in Latin text (Japanese stays upright).
- Log: L or north opens the last 50 lines (`game-list` in a `.game-overlay`), newest at the bottom.
- Auto / Skip: Visual novels only: two `.game-btn` toggles `dlg.auto` and `dlg.skip` (skips only lines already read).

## Texts
(Key | English | 日本語)
- `dlg.next`: Next | 次へ
- `dlg.tap`: Tap | タップ
- `dlg.log`: Log | ログ
- `dlg.auto`: Auto | オート
- `dlg.skip`: Skip | スキップ
- `dlg.mira.1`: The well dried up the summer you left. Will you help me find out why? | あなたが村を出た夏に、井戸が枯れてしまったの。原因を探すのを手伝ってくれる？
- `dlg.mira.help`: I’ll look into it. | 調べてみるよ。
- `dlg.mira.ask`: What happened that summer? | その夏、何があったの？
- `dlg.mira.later`: Not now. | 今はやめておく。

## Keyboard and focus
1. While typing: Enter, Space, south, a click or a tap finishes the line; again goes on.
2. Choices: ↑ ↓ or d-pad, 1–4, Enter/south to choose. The dialogue has no Back: east does nothing unless the script has a “leave” choice, which it then picks.
3. L or north: Log; Esc there closes the log.
- Focus stays inside the dialogue until it closes; then the game takes input again.

## Phone
- The box spans the width with 12 px sides above TouchControls (which hide during dialogue); the portrait shrinks to 48 px.
- Tap anywhere on the box to go on; choices are 44 px buttons.
- In portrait orientation the box takes up to 45 % of the height and scrolls inside.

## Data
```json
{"dialogue": {"id": "mira_well", "speaker": "npc.mira", "portrait": "mira_smile",
  "lines": [{"t": "dlg.mira.1", "choices": [{"t": "dlg.mira.help", "go": "mira_accept", "set": {"quest.well": "active"}},
                                           {"t": "dlg.mira.ask", "go": "mira_story"},
                                           {"t": "dlg.mira.later", "go": "end"}]}]}}
```

- Scripts are JSON in `data/dialogue/<id>.json`; text is keys only, so both languages share one script. Chosen flags go into the save.

## Don't
- Don't type text on the canvas.
- Don't hide choices behind a timer.
- Don't put more than four choices or more than three lines of text in one box.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DialogueBox` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
