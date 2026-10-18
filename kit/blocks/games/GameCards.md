# GameCards

App Block card (Games). A trading card game: build a deck from a collection, then play turns of draw, spend energy, play cards to the board and attack until a player’s health is gone.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Meadow for the board; Ink for a print-like look (ArtPalettes); sprites card art 32 × 32 or vector (ArtFrames vector style); icons 16 px (ArtSprites)
- Game blocks: GameKit, TitleScreen, CardHand, HudPieces, InventoryGrid, ShopScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, GameOver
- Orientation: Landscape on desktop; portrait on the phone (the hand fans along the bottom)

## Screen flow
1. **Title**: Play (against the computer or a friend), Decks, Collection, Packs, Settings.
2. **Deck builder**: the collection as a grid (InventoryGrid of cards, filters by cost and type) and the deck as a list with counts; 30 cards, at most 2 of each; Save Deck is disabled with its reason until valid.
3. **Match**: turn phases Draw → Main → Attack → End; the phase is always shown; End Turn is the default button in Main and Attack.
4. **Results** (ResultsScores): win or loss, turns, rewards (packs, gold).
5. Packs (ShopScreen) open with one card turned at a time.

## HUD
- Each player’s health as a number in a circle beside their portrait (top: opponent, bottom: you).
- Energy as pips (filled = available) beside your health, “3 / 5”.
- The phase strip in the middle right: Draw · Main · Attack · End, the current one highlighted.
- Deck and discard piles with counts (`game-pile`), bottom right; the opponent’s hand as card backs with a count.
- The log of the last 5 actions, collapsible, left edge.

## Genre menus
- Card detail: press and hold (touch) or focus + Inspect: the card large with its full text and keywords explained.
- Target choice: valid targets get a gold outline, others dim; Cancel returns the card to the hand.
- Mulligan at the start: choose cards to redraw, Keep (default).

## Controls
Actions are named once (`select`, `play`, `inspect`, `end_turn`, `cancel`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Choose a card: ← → in the hand, ↑ ↓ to the board | Hover | D-pad / left stick | Tap
- Play / target: Return or Space | Click, or drag to the board | South | Drag up onto the board, or tap then tap the target
- Inspect: I | Right click | North | Press and hold
- End turn: E | End Turn button | Start (hold 0.5 s) | End Turn button
- Cancel: Esc | Right click on empty space | East | ✕ or drag back
- Pause: Esc (with nothing chosen) | — | Back | Menu button

## Phone layout
- Portrait: opponent at the top, the board in two rows of 4 slots, your hand fanned along the bottom (cards 88 px wide, the chosen one raised).
- End Turn is a full-width button above the hand when nothing is chosen.
- Card detail opens as a bottom sheet with the card and its keyword glossary.

## Game blocks
- **CardHand**: hand fan, board slots, card faces and backs, piles
- **HudPieces**: health, energy pips, phase strip
- **InventoryGrid**: the collection in the deck builder
- **ShopScreen**: packs
- **TutorialPrompt**: the first match explains each phase once
- **ResultsScores**: win/loss and rewards
- **PauseMenu**: concede, settings

## Art and sound
- Card frames from ArtFrames (pixel or vector, one style per game); art windows 32 × 32 pixel or flat vector; cost in an energy circle top left.
- Card types told apart by frame colour AND an icon (unit: sword, spell: spark, item: bag).
- Music: a calm loop for the deck builder, a tense loop for matches; cues for draw, play, attack, damage, turn start.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `cards.title`: Pocket Duel | ポケットデュエル
- `phase.draw`: Draw | ドロー
- `phase.main`: Main | メイン
- `phase.attack`: Attack | アタック
- `phase.end`: End | エンド
- `match.end_turn`: End Turn | ターン終了
- `hud.energy`: Energy {n} / {max} | エネルギー {n} / {max}
- `deck.invalid`: A deck needs 30 cards ({n} now) | デッキは 30 枚必要です（現在 {n} 枚）
- `card.inspect`: Inspect | くわしく

## Adding to it
- A new card: name, cost, type, text, one effect from the effect list (deal, heal, draw, summon, buff) and its art recipe.
- A new keyword: one line in the glossary and an icon; the inspect sheet lists it automatically.
- Online play: p2p-core rooms; the match screen is unchanged, a connection badge appears top right.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t rely on drag only: every play works with taps or keys.
- Don’t hide the opponent’s energy and hand count.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, CardHand, HudPieces, InventoryGrid, ShopScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, GameOver.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameCards` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
