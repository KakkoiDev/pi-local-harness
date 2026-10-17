# Music and sound effects in chat

See [using audio in projects](music-projects.md) for app integration and source reuse,
and the [LLM operating guide](../harness/music/AGENT_GUIDE.md) for tool-call instructions.

Ask Pi, in a project's chat:

> Create a cheerful 20-second background loop for a retro robot game. Use success chimes and selection clicks.

Pi chooses curated Blips samples, makes a Strudel pattern, and attaches an audible WAV,
its editable JSON score, a Strudel source export and render metadata to its reply.
Then say:

> Make the melody more playful, reduce the percussion, and keep the same instruments.

Pi reads the saved score and patches its named layers. A failed render leaves the last
successful version intact. Every successful version gets a numbered folder, so you can
compare earlier audio in the chat. Multiple named effects can be returned in one turn.
Nothing starts playing automatically. Terminal Pi returns the local output paths.

## Setup (once)

1. Install [Chip Pops](https://github.com/flaviocopes/chip-pops) (formerly Blips),
   use its menu to install the `blips` command, and generate its library. A source build
   also works (`swift build --product blips`). Run `blips capabilities --json` to check.
   The first library generation can take several minutes with a debug build.
2. Have Node.js 22+ and npm on PATH, then run `plh setup music`. This installs a locked,
   optional runtime in `<data>/toolchain/music`; ordinary startup does not download it.
   From this checkout: `python3 plh.py setup music`.
3. After updating the music engine, rerun `plh setup music` to refresh the optional
   renderer, then restart Pi. Use the existing project chat.

`PI_BLIPS=/absolute/path/to/blips` (or config key `blips`) selects the CLI. Its normal
`BLIPS_HOME` environment variable can select a separate library. Generation is an
explicit setup step; the music tool never replaces your library or generates random
jsfxr parameters. After setup, composition, rendering and revision require no network.
The agent uses the workbench's existing model; there is no second AI service or MCP.
The stable installer ships only source and lockfiles, never development node_modules.

## Saved files and editing

`assets/music/robot/` contains `bank.json`, `samples/*.wav`, `current.json`, and
`0001/`, `0002/`, etc. Each revision contains:

- `audio.wav`: 44.1 kHz mono, 16-bit PCM; native chat playback and download.
- `score.json`: authoritative editable score; stable layer IDs make small revisions possible.
- `pattern.strudel`: equivalent Strudel code for inspection or use in a Strudel environment.
- `render.json`: event count, duration, peak, RMS, attenuation and bank provenance.

The bank records each original sound ID **and library seed**. A pitched selection
`{lead:{id:"fanfare-001",tone:true}}` crops the first isolated, stable note of that
curated sound before the next note starts, adds short edge fades, and records its
original pitch (`rootMidi`) and crop duration. It rejects sliding/noisy notes and
jingles whose notes already overlap at the start. Original exports remain unchanged
for ordinary string selections such as `{click:"click-001"}`. Creation exports WAVs
with Blips' seed check. Later renders use those local files, even if the global Blips
library changes. Chat attachments are immutable copies in that chat's uploads folder;
changing source or rerendering does not replace an earlier message's preview.
To bring the export into another Strudel environment, load the samples first with
`samples({chime:["chime.wav"],click:["click.wav"]},"/samples/")`, using your actual
bank names and sample URL. The exporter does not serve a web sample library.

A score looks like this (choose actual sound IDs through `music catalog`):

```json
{
  "bpm": 96, "seconds": 20, "loop": true,
  "layers": [
    {"id":"melody","sound":"chime","rhythm":"x x x x","speed":"1 1.25 1.5 2","gain":0.25},
    {"id":"percussion","sound":"click","rhythm":"x*4","speed":"1","gain":0.12}
  ]
}
```

The `music` tool exposes template/catalog/create/read/revise/render. Read returns a revision
number. Revision requires that number as `base`, rejects stale edits and patches only
specified layer fields. `changes.add` and `changes.remove` add/remove layers explicitly.
An immutable bank keeps revisions consistent; create a new named composition to choose
a different bank. To edit manually, make changes through `music revise`, or edit the
current revision's `score.json` and call `music render` with its current base. Manual
edits to `pattern.strudel` are not imported. Preserve old revisions if history matters.

**Phases.** The `music` tool's create, revise and render are allowed in every phase (Discussion, Planning and
Implementation), with no task needed, because Gate (`gate/media.py`) lets them write only a new numbered revision folder
under `assets/music/<name>/` inside the project: create needs a name that does not exist yet; revise and render need the
current revision as `base` and a next revision folder that does not exist. A stale base, an existing revision folder, a
symlink on the way, an unsafe name or a call from outside the project folder is refused. A manual edit of `score.json`,
or any `write`, `edit` or shell write into `assets/music/`, is not the music tool and follows the phase rules. The same
rule, one row of `gate/media.py`'s table, will serve the visual tool under `assets/visual/<name>/`.

## Longer compositions

Ask for a key, a chord progression, a four-bar melody, a variation, and sections:

> Make a happy, uplifting tune in C major. Use a C–G–Am–F progression, a memorable
> melody, bass and quiet clicks. Start gently, bring in the full theme, vary the
> melody, then return to the theme. Keep the same Blips instruments when revising.

`template` returns the tested 32-second uplifting-major composition scaffold with
an intro, theme, variation, return, and four instrument roles. The agent selects
the bank and can change its melodies while keeping the timing. This reduces
planning for small models; it is a starting pattern, not generated audio.

`catalog` with `tone:true` (default category `fanfare`) returns pitched candidates
with `rootMidi` and `cropSeconds`. `startup` also contains jingles. Only the first
24 candidates per category are inspected; an empty result means choose another
category. The bank can mix pitched instruments and ordinary effects.

Pitched layers use `notes` **instead of** `speed`. Pitches can be names (`C4`,
`F#4`, `Bb3`) or MIDI numbers. Spaces sequence pitches within one four-beat cycle;
`<>` alternates cycles and commas stack chord voices. Keep each pitch within two
octaves of its sample root. For example:

```json
{
  "bpm":120,"seconds":16,"loop":true,
  "layers":[
    {"id":"lead","sound":"lead","rhythm":"x*4","notes":"<[E4 G4 A4 G4] [D4 G4 B4 A4] [C4 E4 A4 G4] [F4 A4 G4 C5]>","gain":0.3},
    {"id":"chords","sound":"lead","rhythm":"x*4","notes":"<[C4,E4,G4] [G3,B3,D4] [A3,C4,E4] [F3,A3,C4]>","gain":0.08},
    {"id":"bass","sound":"lead","rhythm":"x*4","notes":"<C3 G3 A3 F3>","gain":0.2}
  ],
  "sections":[
    {"id":"intro","cycles":4,"layers":["chords","bass"]},
    {"id":"theme","cycles":4,"layers":["lead","chords","bass"]}
  ]
}
```

Each section selects named layers for its number of cycles. Patterns restart at the
section boundary; the sum of section cycles must fill the requested duration exactly.
Up to 16 sections are supported, each 1–32 cycles. Define another melody layer for a
variation and select it in a later section. Without sections, all layers run together
as before. `changes.sections` replaces the arrangement; `changes.layers` can patch
only a melody's `notes` while preserving harmony, bass, instruments and earlier audio.
Changing between `notes` and `speed` through a patch removes the other pitch control.
The generated Strudel export uses the same pitch ratios and `arrange` timing.

## Initial limits

This is a deliberately small **sample composition subset**, not the full Strudel audio
engine. Real `@strudel/core` and `@strudel/mini` query event timing; a small PCM mixer
plays local samples with resampling, gain, short sample-edge ramps and peak attenuation.
No arbitrary generated JavaScript is evaluated. There are no oscillators, filters,
reverb, delay, stereo panning, stems, MP3 export, audio understanding or mastering AI.
A small Node loader selects Kabelsalat's published ESM build because its package `main`
otherwise prevents Strudel from importing in Node.

Use 1–8 layers and bank sounds, 30–240 BPM and 0.1–120 seconds. One Strudel cycle is
four beats: `setcpm(bpm/4)`. Loops require an integral cycle count and wrap sample tails;
one-shots truncate at the requested duration and fade the outer 5 ms. Rhythm accepts
`x`, rests `~`, groups `[]`, alternation `<>` and `*` repeats (1–32). Speed accepts
mini sequences of ratios between 0.25 and 4, and changes pitch **and** duration together.
Ordinary Blips effects may glide or contain several notes. Use `tone:true` bank
selections for named-note composition. Cropped instruments are short stabs, without
independent note length or sustain; transposition changes duration as well as pitch.
Whole-cycle output is not a guarantee of a musically seamless phrase. Listen and revise.

Rendering rejects silence, excessive event counts, unsupported WAV formats and invalid
patterns. It runs with a 30-second deadline and a 256 MB JavaScript heap limit. Scores
and outputs are local project files, not a sandbox. Missing runtime/CLI/library errors
are returned to the agent, with setup instructions; no other renderer is substituted.
Model composition quality depends on your configured local model. Tests of timing,
files and chat transport do not establish artistic quality.

## Upstream implementation review

Reviewed on 2026-10-16:

- [ApfelStrudel](https://github.com/rcarmo/apfelstrudel/tree/298f2c059df657132290652e268d4eb5934cc898):
  `src/agent/system-prompt.ts`, `src/agent/runner.ts`, `src/tools/pattern.ts`.
  Adopted the workflow of reading current state, making incremental edits and returning
  evaluation errors to the agent for repair. PLH adds transactional publication and stale
  revision checks. No ApfelStrudel UI, agent loop or source code was embedded.
- [Strudel](https://codeberg.org/uzu/strudel/src/commit/61b6e96a4a94a47a0f9329fb8d6f24659c37419f):
  `packages/core/pattern.mjs`, `hap.mjs`, `controls.mjs`, `packages/mini/mini.mjs`,
  and `packages/webaudio/README.md`. Runtime pins npm core/mini **1.2.6**, including
  transitive integrity hashes; it does not vendor the current development branch.
  Strudel/Kabelsalat packages declare AGPL-3.0-or-later; their licenses ship in npm.
- [Blips / Chip Pops](https://github.com/flaviocopes/chip-pops/tree/bbb04904d1e4cb06d9b18a613382155235cbd1e4):
  `Sources/BlipsCLI/Commands.swift`, `Capabilities.swift`, core library/generator and
  `skill/blips/SKILL.md`. Uses actual CLI JSON metadata and seed-checked WAV export.
  The repository declares MIT; its README permits generated sounds in free/commercial apps.

## Verification

Run `python3 tests/verify_workflow.py` and `python3 tests/browser/run.py all` (with
Playwright and Chromium configured as in the contributor guide). The browser test
checks that a generated attachment loads as audio and its score survives reload.
RPC fixtures verify transport separately from model behavior.

For real Strudel integration tests in a checkout, first run
`npm ci --prefix harness/music --ignore-scripts --no-audit --no-fund`, then
`node --test tests/harness/music.test.mjs`. Without the optional runtime the renderer
integration case is explicitly skipped; score validation still runs. Set
`PI_TEST_MUSIC=1` to require the integration case (using the installed toolchain if
present). Tests cover an audible render, targeted revision, unchanged bank/melody,
immutable earlier audio, stale revision rejection, invalid-pattern rollback and bounds.
Additional coverage verifies note cropping, transposition, stacked chords, multi-bar
phrases, section timing and revisions, and rejection of untuned/ambiguous inputs.
