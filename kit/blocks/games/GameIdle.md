# GameIdle

App Block card (Games). An idle or clicker game: tap to earn, buy upgrades that earn on their own, come back later to collect what was made while away.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Meadow (ArtPalettes); sprites 16 × 16 icons, one 64 × 64 centrepiece (ArtSprites)
- Game blocks: GameKit, TitleScreen, HudPieces, ShopScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores
- Orientation: Portrait first; on desktop the centrepiece left and the upgrade list right

## Screen flow
1. **Title** is skipped after the first visit: the game opens straight on the main screen.
2. **Welcome back** (ResultsScores): “While you were away (3 h 12 min): +48,200 coins”; Collect (default).
3. **Main**: tap the centrepiece to earn; the upgrade list (ShopScreen layout) shows each producer with level, rate and next price; affordable ones are bright, others show how long until affordable.
4. **Prestige**: reset coins and producers for a permanent multiplier; the panel shows what is kept and lost before confirming.
5. Progress saves every 10 s and on leaving.

## HUD
- Top: coins as a big number with short scale (“1.25 M”) and the rate under it (“+4,820 / s”).
- A +amount pops from each tap and drifts up (reduced motion: a fade only).
- Buy amount toggle: ×1 · ×10 · ×100 · Max above the list.

## Genre menus
- Upgrade rows: icon, name, level, “+12 / s each”, price button (disabled with time to afford).
- Prestige panel: multiplier now → after, what resets, Confirm (destructive style) and Cancel (default).
- Stats: total earned, taps, time played.

## Controls
Actions are named once (`tap`, `buy`, `buy_amount`, `prestige`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Earn: Space | Click the centrepiece | South | Tap the centrepiece
- Buy the chosen upgrade: Return, or 1–9 for rows | Click its price | West | Tap its price
- Choose a row: ↑ ↓ | Hover | D-pad | Scroll
- Buy amount: Tab cycles ×1 · ×10 · ×100 · Max | Click the toggle | Shoulders | Tap the toggle
- Pause: Esc | — | Start | Menu button

## Phone layout
- Portrait: coins on top, the centrepiece in the middle third, the upgrade list as a scrolling sheet below it.
- Auto-tap after holding for 1 s (setting) so the thumb can rest.
- Big numbers use short scale words in English (K, M, B, T) and 万・億・兆 in Japanese.

## Game blocks
- **HudPieces**: coins and rate
- **ShopScreen**: the upgrade list
- **ResultsScores**: welcome back and prestige results
- **TutorialPrompt**: “Tap the coin” and “Buy your first helper”
- **GameSettings**: number format, auto-tap, sound
- **PauseMenu**: stats, settings

## Art and sound
- A 64 px centrepiece (a big coin, a tree, a slime) with a 3-frame squash on tap; producers as 16 px icons.
- Numbers in the game font with tabular digits; never shrink below 14 px.
- Music: a slow, quiet loop; cues for tap (very short), buy, milestone.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `idle.title`: Coin Garden | コインガーデン
- `hud.rate`: +{rate} / s | 毎秒 +{rate}
- `away.title`: While you were away ({time}) | 留守のあいだに（{time}）
- `away.collect`: Collect | 受け取る
- `buy.amount_max`: Max | 最大
- `upgrade.afford_in`: in {time} | あと {time}
- `prestige.confirm`: Start Over with ×{mult} | ×{mult} でやり直す
- `number.million`: {n} M | {n}万

## Adding to it
- A producer: name, icon, base price, growth (×1.15 per level), base rate.
- Achievements: a list with progress bars; each gives a small multiplier.
- Events: a timed bonus (2× for 30 s) with a visible countdown.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t show exact numbers past 15 digits; use the short scale.
- Don’t make prestige the default button.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, HudPieces, ShopScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameIdle` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
