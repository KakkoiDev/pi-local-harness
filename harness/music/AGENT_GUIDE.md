# Music guide for LLM agents

Use the registered `music` tool in the project's working directory. The harness
injects a short music guide for matching requests and keeps it available in projects
that already have `assets/music/`. This document is the detailed operating guide;
it is also copied into `<data>/toolchain/music/` by `plh setup music`.

The music tool works in every phase (Discussion, Planning, Implementation) without a task, because Gate lets it write
only a new numbered revision folder under `assets/music/<name>/` in the project, never overwriting: `create` needs a
name that does not exist yet, `revise` and `render` need the current revision as `base`. A stale base, an existing
revision folder, a symlink or running outside the project folder is refused; read again and retry. Writing in
`assets/music/` with `write`, `edit` or the shell is not the music tool and follows the phase rules.

User-facing setup and application integration: [project guide](../../docs/music-projects.md)
in the repository. That relative link is for the repository copy of this document.

## Create a track promptly

1. Call `music` with `{"action":"template"}` for a tested uplifting-major score.
   Keep its tempo, duration and arrangement unless the request requires changes.
   Open-ended planning stalled in the local-model trial; a concrete scaffold let
   the model compose and render. Select notes and submit the tool call promptly.
2. Call `{"action":"catalog","category":"fanfare","tone":true}` for pitched
   instruments; `startup` is another useful category. Call catalog with category
   `click` or `hit` for percussion. Use IDs actually returned by the local library.
3. Select a bank matching the template's aliases: `lead`, `chords`, `bass`, `click`.
   Pitched selections use `{"id":"returned-id","tone":true}`; ordinary effects
   use an ID string. Check the returned `rootMidi`: every desired note must be
   within 24 semitones above or below that instrument root. Do not assume C4.
4. Call create with a lowercase name, the bank and the complete score. For example,
   `{"action":"create","name":"robot","bank":{...},"score":{...}}`, replacing
   both objects with the selected bank and template score. Customize the lead and
   variation to fit the request while retaining stable layer IDs and timing.
5. Present the result only after rendering succeeds. The web chat attaches audio
   and editable sources automatically; terminal Pi returns local paths. Describe
   what was composed without claiming to have listened to or judged the audio.

The bank stores sound IDs and the library seed. `tone:true` crops a stable first
note from a curated Blips sound before the next note begins; it does not invent
new synth parameters. Use ordinary exports for multi-note jingles or effects that
should retain their original shape. Do not silently substitute another renderer.

## Composition rules

- One cycle is four beats. Total cycles × 240 / BPM = seconds. Loop length must
  contain whole cycles. If sections are supplied, their cycles must fill the
  duration exactly. The template has four sections of four cycles: 32 s at 120 BPM.
- Each layer has `id`, `sound` (a bank alias), `rhythm`, `gain`, and either `notes`
  or `speed`. Names start with a lowercase letter and use lowercase letters,
  digits, underscores or hyphens, up to 40 characters.
- Rhythm: `x` triggers, `~` rests, `[]` subdivides, `<>` alternates cycles, and
  `*` repeats 1–32 times. `x*8` gives eight notes per cycle; `x ~ x ~` hits twice.
- Pitched layers use `notes`, e.g. `<[C4 E4 G4 E4] [B3 D4 G4 D4]>` for two bars.
  Names such as `F#4`, `Bb3` and MIDI numbers are accepted. Commas stack chord
  voices: `<[C4,E4,G4] [G3,B3,D4] [A3,C4,E4] [F3,A3,C4]>`.
- Unpitched layers use a speed string, e.g. `"1"` or `"1 1.25 1.5 2"`. Ratios
  must stay between 0.25 and 4. Do not supply both notes and speed.
- Cropped notes are short stabs, without sustain. Repeat chord/bass triggers each
  beat (`x*4`) to maintain movement; `x` is one short hit per bar. Transposition
  changes duration together with pitch. Keep chord and percussion gains modest.
- Sections select existing layer IDs: `{"id":"intro","cycles":4,"layers":["chords","bass"]}`.
  Phrases restart at section boundaries. Select a separate variation layer later,
  then return to the original lead. Limits: 8 layers/bank sounds, 16 sections,
  1–32 cycles per section, 30–240 BPM, 0.1–120 seconds, gain 0–1.

## Create a one-shot effect

Catalog a relevant category, select an actual ID and create a separate named asset.
Use one layer, rhythm `"x"`, speed `"1"`, `loop:false`, and enough seconds for the
sample tail. Success/coin suit chimes; click/hit suit small impacts; explosion suits
low hits. To match a track, select IDs and the seed from its recorded bank. A new
composition needs the matching global library available for its initial export.

## Revise without rebuilding

Always read first: `{"action":"read","name":"robot"}`. Use the returned revision
as `base`, then patch named layers:

```json
{"action":"revise","name":"robot","base":1,"changes":{"layers":[{"id":"beat","gain":0.06}]}}
```

Patch only what the user requested. Preserve other notes, rhythms, sections and the
bank. `changes.sections` replaces the arrangement; `changes.add` and
`changes.remove` change the layer set. Update section references when removing a
layer. A pitch patch switches between notes and speed by removing the other field.
Changes to BPM or duration may require matching section-cycle changes.

Do not recreate an asset to lower percussion, change a phrase or raise its volume.
A different bank requires a new named composition. `render` rerenders the current
score and also requires the current `base`; it does not import arbitrary Strudel
JavaScript. `score.json` is authoritative.

## Validate, recover and integrate

A successful result includes duration, event count, peak, RMS and attenuation.
Silence, invalid syntax, unsupported WAVs, excessive events and stale revisions
are rejected. Use the reported error to repair the fields, at most twice. Read
again after a stale-revision error. Failed attempts preserve the last good audio.
Peak/RMS describe levels, not artistic quality; let the listener request rework.

Missing runtime: `plh setup music`, then restart after updating the harness.
Missing CLI/library: install Chip Pops' `blips` CLI and explicitly generate its
library. `PI_BLIPS` chooses the binary; `BLIPS_HOME` chooses the library. Do not
replace or regenerate the user's library automatically.

Files live in `assets/music/<name>/`: `bank.json`, `samples/`, `current.json` and
numbered revisions containing WAV, JSON score, Strudel export and render metadata.
When the user requests application integration (Implementation, within an approved task), use ordinary file/code tools to
copy an approved WAV into the app's asset folder and wire up playback. The music
tool does not publish assets. Preserve the authoring folder and earlier revisions;
a copied release WAV changes only when explicitly refreshed. Runtime playback of
that WAV does not need the music-generation dependencies. Respect the app's
mute/volume control and start audio through a user action.

This renderer supports sample timing, pitch and gain. Full Strudel JavaScript,
oscillators, sustain controls, reverb, delay, stereo, stems, MP3 export and audio
understanding are outside this capability. Explain these limits accurately.
