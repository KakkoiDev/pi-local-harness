# GameCozy

App Block card (Games). A cozy farming and life game: plant, water and harvest through a day cycle, craft, sell at the shop and befriend the villagers.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Meadow (ArtPalettes); sprites 16 × 16, portraits 32 × 32 (ArtSprites)
- Game blocks: GameKit, TitleScreen, SaveSlots, HudPieces, InventoryGrid, ShopScreen, DialogueBox, QuestLog, MapScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, TouchControls
- Orientation: Landscape on desktop; portrait or landscape on the phone

## Screen flow
1. **Title**: Continue (the farm), New Farm, Load (SaveSlots: farm name, season, day, money).
2. **A day** runs from 6:00 to 24:00 (one in-game minute = 0.7 s); actions use energy; the hotbar holds tools and seeds.
3. **Shop** (ShopScreen) opens 9:00–17:00; **Talk** (DialogueBox) with villagers raises friendship hearts; gifts once a day.
4. **Sleep** in bed or at 24:00: a day summary (money earned, crops shipped, friendship changes) using ResultsScores, then the save happens automatically.
5. Nothing fails: running out of energy sends the player home; no game over.

## HUD
- Top right: the clock panel — season and day (“Spring 3”), time (“9:40”), weather icon, money with a coin icon.
- Bottom centre: the hotbar, 8 slots (InventoryGrid row), the selected tool outlined in gold, counts on seeds.
- Bottom left: the energy bar (HudPieces `energy`), green turning red under 20 %.
- The tile under the cursor or in front of the player is outlined (1 px gold) to show where the tool acts.

## Genre menus
- Inventory with crafting: items left, recipes right (needs and makes), Craft greyed with its reason when missing items.
- Friendship list: each villager with 0–10 hearts and their birthday.
- Calendar: the season’s 28 days with festivals and birthdays (MapScreen style panel).

## Controls
Actions are named once (`move`, `use_tool`, `interact`, `hotbar_next`, `hotbar_prev`, `inventory`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Move: WASD or arrow keys | Click a tile to walk there | Left stick or d-pad | Stick
- Use tool: C or left click | Left click on a tile | West | Use button
- Interact / talk / harvest: X, E or right click | Right click | South | Tap the thing
- Next / previous tool: 1–8, mouse wheel | Wheel | Right / left shoulder | Tap a hotbar slot
- Inventory: I or Tab | — | North | Bag button
- Pause: Esc | — | Start | Pause button (top right)

## Phone layout
- Portrait: the farm on top, a two-row hotbar (4 + 4) above the stick and the Use button.
- Tap a tile to walk there and act on it (no stick needed); the stick is optional in settings.
- The clock panel stays top right, smaller (day and time only); money moves into the bag.

## Game blocks
- **HudPieces**: clock, money, energy
- **InventoryGrid**: hotbar and bag, crafting
- **ShopScreen**: seeds and tools to buy, crops to sell
- **DialogueBox**: villager talk and gifts
- **QuestLog**: requests from the notice board
- **MapScreen**: the town and the calendar
- **SaveSlots**: farms
- **TutorialPrompt**: the first day’s hints
- **TouchControls**: stick, Use and tap-to-act

## Art and sound
- Crops grow in 4 stages per crop (seed, sprout, young, ripe) as 16 px frames with ramps `G → g → l`; ripe crops get a 1 px gold glint.
- Day cycle: a palette multiply over the canvas (morning warm, noon none, evening amber, night Dusk) — never over the HTML HUD.
- Terrain: visual-core meadow kit with tilled soil (`n`) and watered soil (one shade darker).
- Music: a gentle loop per season, quieter at night; cues for hoe, water, harvest pop, coin, door.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `cozy.title`: Sunny Acre | ひだまり農園
- `hud.season_day`: {season} {day} | {season} {day}日
- `season.spring`: Spring | 春
- `hud.money`: {amount} g | {amount} G
- `hud.energy`: Energy | たいりょく
- `tool.hoe`: Hoe | くわ
- `tool.can`: Watering Can | じょうろ
- `summary.title`: End of Day {day} | {day}日目のおわり
- `summary.shipped`: Shipped | 出荷

## Adding to it
- A new crop: four 16 px frames, days per stage, price; the shop lists it by season.
- Animals: a barn screen with each animal’s hearts and a daily product, using the same hotbar.
- Fishing: a timing minigame overlay with one bar (HudPieces) and a catch card.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t punish: no game over, no lost crops without a warning the day before.
- Don’t hide the time: a day must be plannable.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, SaveSlots, HudPieces, InventoryGrid, ShopScreen, DialogueBox, QuestLog, MapScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, TouchControls.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameCozy` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
