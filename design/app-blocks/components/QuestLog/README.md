# QuestLog

The player's quests: active, done and failed, each with its giver, steps checked off, the reward, and the option to track one on the HUD.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-tabs`, `game-list`) |
| Needs | GameKit; quest definitions and progress (Data); HudPieces (the tracked quest becomes the objective) |
| Links to | MapScreen (Show on Map), DialogueBox (quests start in dialogue) |

## Markup

```html
<section id="quests" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="q-title" hidden>
  <div class="game-panel" style="width:min(700px,100%);display:grid;gap:10px">
    <h2 id="q-title" class="game-h" data-t="quests.title">Quests</h2>
    <div class="game-tabs" role="tablist">
      <button class="game-tab" role="tab" aria-selected="true"><span data-t="quests.active">Active</span> 3</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1"><span data-t="quests.done">Done</span> 5</button>
    </div>
    <div class="game-row" style="align-items:flex-start;gap:16px">
      <ul class="game-list" role="listbox" aria-label="Active quests" style="flex:1;min-width:200px">
        <li role="option" tabindex="0" aria-selected="true"><span aria-label="Tracked">◆</span><span data-t="quest.well">The Dry Well</span></li>
        <li role="option" tabindex="-1"><span aria-hidden="true" style="width:1ch"></span><span data-t="quest.lost_cat">A Cat on the Roof</span></li>
      </ul>
      <article style="flex:1.4;min-width:220px;display:grid;gap:6px" aria-live="polite">
        <span class="game-speaker" data-t="quest.well">The Dry Well</span>
        <p class="game-small" style="margin:0"><span data-t="quests.from">From</span> Old Mira · Willow Field</p>
        <p class="game-line" style="font-size:13px;margin:0" data-t="quest.well.desc">The village well dried up the summer you left. Find out why.</p>
        <ul style="list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:13px">
          <li>☑ <s data-t="quest.well.s1">Talk to Old Mira</s></li>
          <li>☐ <span data-t="quest.well.s2">Find the old well north of the field</span></li>
          <li>☐ <span data-t="quest.well.s3">Bring back what you find (0/3)</span></li>
        </ul>
        <p class="game-small" style="margin:0"><span data-t="quests.reward">Reward</span>: 50 coins · Rope</p>
      </article>
    </div>
    <p class="game-hint"><!-- Enter/south: Track · M/west: Show on Map · Esc/east: Back --></p>
  </div>
</section>
```

## States

| State | What changes |
| --- | --- |
| Tracked | ◆ before the name (and `aria-label="Tracked"`); its current step is the HUD objective. One quest at a time. |
| New | A dot `•` and `quests.new` until opened once. |
| Step done | ☑ and strikethrough; `hud.new_objective` announces the next step. |
| Done | Under the Done tab; the detail's “From” line is followed by `quests.completed_on` (set from code, `{day}` the in-game day). |
| Failed | Under Done, in dim text with `quests.failed` and the reason. |
| No quests | `quests.none` in the list area. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `quests.title` | Quests | クエスト |
| `quests.active` | Active | 進行中 |
| `quests.done` | Done | 完了 |
| `quests.from` | From | 依頼人 |
| `quests.reward` | Reward | 報酬 |
| `quests.track` | Track | 追跡する |
| `quests.show_map` | Show on Map | 地図で見る |
| `quests.new` | New | NEW |
| `quests.completed_on` | Completed on day {day} | {day} 日目に完了 |
| `quests.failed` | Failed | 失敗 |
| `quests.none` | No quests yet. People in the village may need help. | まだクエストはありません。村の人が困っているかもしれません。 |
| `quest.well` | The Dry Well | 枯れた井戸 |
| `quest.well.desc` | The village well dried up the summer you left. Find out why. | あなたが村を出た夏に井戸が枯れた。原因を突き止めよう。 |
| `quest.well.s1` | Talk to Old Mira | ミラばあさんと話す |
| `quest.well.s2` | Find the old well north of the field | 野原の北にある古い井戸を探す |
| `quest.well.s3` | Bring back what you find ({n}/{max}) | 見つけたものを持ち帰る（{n}/{max}） |

## Keyboard and focus

1. Tabs (Q / E, shoulders) → 2. quests (↑ ↓) → details update as focus moves.
- Enter/south: Track; M/west: Show on Map; Esc/east or J: close. J opens the log from play.

## Phone

- The list fills the screen; choosing a quest opens its detail as the next page with Back.

## Data

```json
{"quests": {"well": {"state": "active", "step": 1, "counts": {"s3": 0}, "tracked": true, "seen": true}},
 "defs": {"well": {"giver": "npc.mira", "place": "place.willow_field", "steps": ["s1", "s2", {"id": "s3", "max": 3}], "reward": {"coins": 50, "items": ["rope"]}}}}
```

## Don't

- Don't spoil later steps: show only steps reached so far.
- Don't track more than one quest on the HUD.
