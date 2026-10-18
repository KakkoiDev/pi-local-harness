# GameVisualNovel

App Block card (Games). A visual novel: a story told in scenes of backgrounds, characters and lines of dialogue, with choices that branch it, saves, and a log of what was said.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Ink for the UI; the art in any palette (ArtPalettes); sprites characters as 64 px pixel art or vector illustration (ArtFrames vector style) (ArtSprites)
- Game blocks: GameKit, TitleScreen, DialogueBox, SaveSlots, PauseMenu, GameSettings, TutorialPrompt, MapScreen
- Orientation: Landscape on desktop; portrait on the phone (the character crops to the waist)

## Screen flow
1. **Title**: Start, Continue (the last autosave), Load (SaveSlots with a scene thumbnail and the last line), Endings (unlocked endings, with hints for the rest), Settings.
2. **Scene**: background, up to 3 characters, the dialogue box; a line types out (text speed setting) and waits for Next.
3. **Choice**: 2–4 options replace Next; chosen options show a dim check next time.
4. **Log**: the last 200 lines with speakers; choices marked; scroll back without losing the place.
5. **Ending**: an end card with its name and number (“Ending 2 of 4: The Lantern Path”), then Title. No game over.

## HUD
- Nothing over the scene except the dialogue box; a small row of controls on the box: Log · Auto · Skip · Save · Menu.
- Auto (lines advance after a pause based on length) and Skip (only already-read lines by default) show a dotted tag while on.
- The speaker’s name tab on the box; the speaking character is at full colour, the others dimmed one step.

## Genre menus
- Save / Load: 12 slots per page with thumbnail, chapter, date and time and the line; Quick Save in one key.
- Settings: text speed, auto speed, skip unread (off), text size, voice/music/sound volumes, language.
- Endings list: unlocked names; locked ones as “???” with a one-line hint.

## Controls
Actions are named once (`next`, `choose`, `log`, `auto`, `skip`, `quick_save`, `hide_box`, `menu`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Next line: Space, Return or click | Left click | South | Tap anywhere
- Choose an option: ↑ ↓ then Return, or 1–4 | Click | D-pad then south | Tap the option
- Log: L or ↑ on the wheel | Wheel up | North | Log button
- Auto / skip: A / Ctrl (hold) | Buttons on the box | West / right trigger (hold) | Buttons on the box
- Hide the box: H | Right click | East | Two-finger tap
- Menu: Esc | — | Start | Menu button

## Phone layout
- Portrait: the background crops to the centre, the speaking character to the waist; the box takes the bottom 40 % with 16 px text (Japanese 15 px, line height 1.8).
- Controls on the box as 44 px icon buttons with labels in the menu.
- Choices as full-width 52 px rows above the box.

## Game blocks
- **DialogueBox**: lines, names, choices, the log
- **SaveSlots**: saves with thumbnails and the last line
- **TitleScreen**: start, continue, endings
- **PauseMenu**: save, load, settings, title
- **GameSettings**: text and auto speed, volumes, language
- **TutorialPrompt**: one hint on the first line: how to advance
- **MapScreen**: optional: a place map for free-time choices

## Art and sound
- Backgrounds 320 × 180 (pixel) or vector; characters with 3–6 expressions each (`face`: calm, happy, sad, angry, surprised) from the same parts, same size and position so swaps don’t jump.
- Ink UI over any art; the box 85 % opaque so text is always 4.5 : 1.
- Music: one theme per character or place, crossfaded on scene change; cues for choice, save, a soft tick when a line ends.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `vn.title`: Lantern Lane | ランタン横丁
- `vn.start`: Start | はじめる
- `vn.continue`: Continue | つづきから
- `vn.endings`: Endings | エンディング
- `box.log`: Log | ログ
- `box.auto`: Auto | オート
- `box.skip`: Skip | スキップ
- `box.save`: Save | セーブ
- `ending.card`: Ending {n} of {total}: {name} | エンディング {n} / {total}：{name}

## Adding to it
- A new scene: background id, characters with expressions and positions, lines with speakers, an optional choice that sets a flag.
- A route: a flag set by a choice and checked at the branch; the endings list gets one more entry.
- Voice: one audio file per line id; the box shows a speaker icon and a Replay Voice button.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t skip unread lines by default.
- Don’t set long text in a pixel font: lines use the readable game font size (16 px or more).

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, DialogueBox, SaveSlots, PauseMenu, GameSettings, TutorialPrompt, MapScreen.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameVisualNovel` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
