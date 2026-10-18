# DialogueBox

A character speaks at the bottom of the screen with a portrait, the text appearing letter by letter, and up to four choices.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-dialogue`, `game-panel`, `game-portrait`, `game-speaker`, `game-line`, `game-menu`, `game-btn`) |
| Needs | GameKit; a dialogue script (Data); portraits from visual-core (64 × 64 px at 1 art pixel = `--g-px`) |
| Used in | GameRpg, GameCozy, GameVisualNovel, TutorialPrompt (longer explanations) |

## Markup

```html
<section id="dialogue" class="game-dialogue" role="dialog" aria-labelledby="dlg-speaker" aria-describedby="dlg-line">
  <canvas class="game-portrait" width="16" height="16" role="img" aria-label="Old Mira, smiling"></canvas>
  <div class="game-panel" data-tone="light">
    <span id="dlg-speaker" class="game-speaker" style="color:var(--g-bad)">Old Mira</span>
    <p id="dlg-line" class="game-line" data-t="dlg.mira.1">The well dried up the summer you left. Will you help me find out why?</p>
    <ul class="game-menu" style="margin-top:8px" aria-label="Your answer">
      <li><button class="game-btn" data-choice="help" data-t="dlg.mira.help" autofocus>I’ll look into it.</button></li>
      <li><button class="game-btn" data-choice="ask" data-t="dlg.mira.ask">What happened that summer?</button></li>
      <li><button class="game-btn" data-choice="later" data-t="dlg.mira.later">Not now.</button></li>
    </ul>
    <p class="game-hint" style="justify-content:flex-end">
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">Enter</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="south" aria-label="South button" data-t-label="game.pad.south"></span></span><span data-for="touch" data-t="dlg.tap">Tap</span><span data-t="dlg.next">Next</span></span>
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">L</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="north" aria-label="North button" data-t-label="game.pad.north"></span></span><span data-t="dlg.log">Log</span></span>
    </p>
  </div>
</section>
```

The `.game-panel` on a light tone keeps dark text on paper. The speaker's name takes the colour of their portrait's main colour only when that colour has 4.5 : 1 on the paper; otherwise `--g-ink`.

## States

| State | What changes |
| --- | --- |
| Typing | Letters appear at 40 per second (Japanese: 25 per second); confirm shows the whole line at once; a second confirm goes on. Reduce Motion: whole lines at once. |
| Line done, more to say | A ▼ marker blinks at the end of the line; no choices. |
| Choices | Shown only after the line is complete; the first is focused; numbers 1–4 choose directly. |
| No portrait | The portrait is removed; the panel takes the full width. |
| Narration | No speaker, no portrait; the line is italic in Latin text (Japanese stays upright). |
| Log | L or north opens the last 50 lines (`game-list` in a `.game-overlay`), newest at the bottom. |
| Auto / Skip | Visual novels only: two `.game-btn` toggles `dlg.auto` and `dlg.skip` (skips only lines already read). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `dlg.next` | Next | 次へ |
| `dlg.tap` | Tap | タップ |
| `dlg.log` | Log | ログ |
| `dlg.auto` | Auto | オート |
| `dlg.skip` | Skip | スキップ |
| `dlg.mira.1` | The well dried up the summer you left. Will you help me find out why? | あなたが村を出た夏に、井戸が枯れてしまったの。原因を探すのを手伝ってくれる？ |
| `dlg.mira.help` | I’ll look into it. | 調べてみるよ。 |
| `dlg.mira.ask` | What happened that summer? | その夏、何があったの？ |
| `dlg.mira.later` | Not now. | 今はやめておく。 |

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
