# GameRpg

App Block card (Games). A top-down role-playing game: explore a map, talk to people, fight, collect items and finish quests.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Meadow (Dusk for caves and night) (ArtPalettes); sprites 16 × 16, portraits 32 × 32 (ArtSprites)
- Game blocks: GameKit, TitleScreen, SaveSlots, PauseMenu, GameSettings, ControlsRemap, HudPieces, DialogueBox, InventoryGrid, Equipment, ShopScreen, QuestLog, MapScreen, TutorialPrompt, GameOver, TouchControls
- Orientation: Landscape on desktop; portrait or landscape on the phone (the HUD and touch controls follow)

## Screen flow
1. **Title** (TitleScreen): New Game, Continue (latest save), Load (SaveSlots), Settings, Quit on desktop builds only.
2. **Explore**: the map scrolls with the hero; touching a person or a sign opens **Talk** (DialogueBox); stepping into an enemy starts **Fight** in place (action) or on a battle screen (turn-based: a menu of Attack, Skill, Item, Run).
3. **Pause** (PauseMenu) opens the field menu: Items (InventoryGrid), Equipment, Quests (QuestLog), Map (MapScreen), Save (SaveSlots, only at save points), Settings.
4. Shops open ShopScreen from a shopkeeper’s dialogue choice.
5. HP at 0 → GameOver: Continue from the last save, or Title.

## HUD
- Top left: hearts or an HP bar, an MP bar under it (HudPieces `health`, `energy`).
- Top right: the minimap (HudPieces `minimap`), hidden in towns if the map is small.
- Under the minimap: the current objective in one line (HudPieces `objective`), from the active quest.
- Bottom right: the action prompt for what is in front of the hero (“Talk”, “Open”, “Read”), only when something is there (TutorialPrompt style).
- Turn-based fights replace the HUD with the battle menu and each fighter’s HP.

## Genre menus
- Field menu as tabs in one panel: Items · Equipment · Quests · Map · Save · Settings (game-tabs, ← → or shoulder buttons to switch).
- Battle menu (turn-based): Attack · Skill · Item · Run, then a target list; damage numbers float over the canvas.
- Shop: Buy / Sell tabs, price in gold, owned count, the stat change for equipment (+2 ATK in green, −1 DEF in red with an arrow).

## Controls
Actions are named once (`move`, `confirm`, `back`, `attack`, `menu`, `map`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Move: Arrow keys or WASD | — | Left stick or d-pad | Stick (left thumb)
- Confirm / talk: Z, Space or Return | Left click on the person | South | Tap the person, or ◯ button
- Back / cancel: X or Esc (in menus) | Right click | East | ✕ in the panel corner
- Attack (action combat): C or J | Left click on empty ground | West | Attack button (right thumb)
- Field menu: Tab or I | — | North | Menu button (top right)
- Map: M | — | Back (left centre) | Minimap tap
- Pause: Esc | — | Start (right centre) | Pause button (top right)

## Phone layout
- Landscape: stick bottom left, Attack and Talk bottom right, HUD corners inset by the safe area.
- Portrait: the map takes the top two thirds; the stick and buttons sit on a dark band below it, so thumbs never cover the hero.
- Dialogue covers the bottom third; tap anywhere to advance, choices are 44 px rows.
- Pause on blur: leaving the app opens PauseMenu.

## Game blocks
- **GameKit**: the HTML layer, palette roles and fonts
- **TitleScreen**: title art, New Game / Continue
- **SaveSlots**: three slots with place, play time and level
- **HudPieces**: health, energy, minimap, objective
- **DialogueBox**: portrait, name, typed line, up to 4 choices
- **InventoryGrid**: items with counts, Use / Drop
- **Equipment**: weapon, armour, accessory slots with stat changes
- **ShopScreen**: buy and sell
- **QuestLog**: active and done quests, the tracked one
- **MapScreen**: the explored map with markers
- **PauseMenu**: the field menu
- **GameOver**: Continue or Title
- **TouchControls**: stick + 2 buttons

## Art and sound
- visual-core: hero and townsfolk from ArtSprites parts (16 px, full outline), monsters `blob`, `beast`, `flyer`; portraits 32 px with faces `calm`, `happy`, `angry`.
- Terrain: visual-core’s meadow terrain kit (Blob 47 joins) for fields, the dungeon preset for caves (Dusk palette); towns from static tiles.
- Items and icons: the 16 px icon set (potion, key, coin, sword, shield).
- Music (the music feature): a calm town loop, a field loop, a battle loop (faster), a short victory jingle; cues for confirm, cancel, hit, coin, level up.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `rpg.title`: Meadow Tale | メドウ物語
- `rpg.new_game`: New Game | はじめから
- `rpg.continue`: Continue | つづきから
- `hud.hp`: HP | HP
- `hud.mp`: MP | MP
- `hud.objective`: Find the lost key in the forest | 森でなくした鍵をさがす
- `prompt.talk`: Talk | はなす
- `prompt.attack`: Attack | こうげき
- `menu.items`: Items | もちもの
- `menu.equipment`: Equipment | そうび
- `menu.quests`: Quests | クエスト
- `menu.map`: Map | マップ

## Adding to it
- A new area: a terrain recipe + a map file + one quest; reuse the field HUD.
- Turn-based instead of action combat: add a battle screen with the battle menu above; the rest stays.
- Party members: a portrait row in the field menu and one HP bar each in battles.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t pause the game while a dialogue types; pause only for the field menu and PauseMenu.
- Don’t let a save happen during a fight or a cutscene.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, SaveSlots, PauseMenu, GameSettings, ControlsRemap, HudPieces, DialogueBox, InventoryGrid, Equipment, ShopScreen, QuestLog, MapScreen, TutorialPrompt, GameOver, TouchControls.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameRpg` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
