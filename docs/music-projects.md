# Using music and sounds in a project

Music belongs to the project whose chat you are using. Open or add your app's folder
in Pi Workbench, then make the request in that project's chat. The agent saves the
source and audio under that folder's `assets/music/` directory.

For installation and engine limits, see [music setup](music.md). For instructions
addressed to an LLM, see the [music agent guide](../harness/music/AGENT_GUIDE.md).

## First track and effects

After installing Chip Pops' `blips` command and generating its library, run:

```sh
plh setup music
```

Restart Pi after installing or updating the harness. Refresh the music runtime with
that command whenever the music engine changes. Ordinary project playback needs
only the finished WAV files; it does not need Node, Strudel, Blips or an LLM.

In the app's project chat, try:

> Create a happy background loop named robot. Start from the uplifting composition
> pattern, choose Blips instruments, and give it an intro, theme, variation and return.
> Also create a short confirmation effect named confirm with a compatible sound.

The agent returns audio controls and editable sources in the same chat. The initial
uplifting pattern is 32 seconds at 120 BPM. You can request another duration; loops
must contain complete four-beat cycles. Effects can be short one-shots.

Then revise by name:

> In robot, make the variation more playful and lower the percussion. Keep the main
> melody, chords, bass, tempo and instruments. Leave confirm alone.

Each successful revision preserves the earlier version. The agent reads the current
score and changes the requested layers. If you want a different instrument bank,
ask for a new named composition; an existing bank stays fixed across revisions.

## Put the audio in your app

When you like a version, ask:

> Copy the current robot track to public/audio/background.wav and the current confirm
> effect to public/audio/confirm.wav. Add a music control and play confirm after a
> successful action. Keep the editable music sources in the project.

This is a request for the agent to copy and integrate the files using its ordinary
project tools. The music tool itself writes only `assets/music/`; it does not know
your app's build system or publish files automatically. `public/audio/` is a common
web-app example; use your framework's static folder or your game's audio resource
folder instead.

A simple website can expose the loop with native controls:

```html
<audio controls loop preload="none" src="/audio/background.wav"></audio>
```

An effect can be triggered by an existing success handler:

```javascript
const confirmation = new Audio('/audio/confirm.wav');
async function playConfirmation() {
  confirmation.currentTime = 0;
  try { await confirmation.play(); }
  catch { /* The browser may require a user gesture before allowing audio. */ }
}
```

Connect music start/stop to a user action and respect the app's mute/volume control.
Test the loop boundary in the target app: a whole-cycle render does not guarantee a
seamless musical transition, and some playback engines introduce a gap. Transpose
or rearrange notes through the agent if the phrase needs a better ending.

## Keep sources and releases reproducible

`assets/music/robot/current.json` identifies the latest successful numbered revision.
Each revision contains `audio.wav`, `score.json`, `pattern.strudel` and `render.json`.
The parent folder contains the shared `bank.json` and exported `samples/`.

Keep the bank, samples and scores together in version control if you want the
composition to remain editable on another machine. Generated audio can follow your
project's usual binary-asset policy. Do not commit the global Blips library or
`node_modules`. A later render can use the saved samples without exporting them
again from the global library.

Copy an approved numbered WAV to a stable application asset path. A later music
revision does not automatically update that copy; ask the agent to replace it when
approved. Chat previews remain immutable, so older messages still play the earlier
version. The app can ship the WAV alone, while the repository keeps the authoring
files. Editing the exported `.strudel` file does not update the JSON score.

For several apps, copy an entire named composition folder into the new project's
`assets/music/` folder, retaining its bank, samples, current pointer and revisions.
Then ask the agent in that project's chat to read it before revising. Use a distinct
name if that project already has a composition with the same name. To match UI
sounds, select effects from the same Blips IDs and library seed recorded in the bank.
