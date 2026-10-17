# Pi Workbench

**Make your own apps by talking with an AI that runs on your own computer.**

![Pi Workbench: a project's files on the left, the chat with Pi in the middle, and the app Pi is building running live on the right](docs/screenshots/workbench.png)

You describe what you want in plain words. Pi, a coding agent, writes the code. You watch the app change in the
Preview next to the chat, and you can undo any change with one click. Everything runs on your Mac: the AI model
(through [Ollama](https://ollama.com)), Pi, and the workbench itself. Your projects, chats and files stay on your machine.

It is made for people who are learning to build things. It explains what it does in plain words and checks
Pi's work. When the local model makes a mistake, the workbench catches it.

## What you can do

- **Chat with Pi about a project.** Each project is a normal folder on your computer, with one chat, a plan
  (`ROADMAP.md` and its tasks) and your files.
- **Start from a ready-made project.** Choose a web app (Python, FastAPI, htmx), an app that needs no server, a
  terminal app, or an empty folder. Pi knows each starter well, so it gets things right more often.
- **See your app as you build it.** The Preview runs your app beside the chat. It can show phone, tablet and full
  sizes, in English or Japanese, and open the app on your phone.
- **Write and review like in a document.** Plans and notes are Markdown files you edit as headings, lists and
  checkboxes. Select a passage to comment on it, or ask Pi about it.
- **Stay safe.** Gate checks every command before Pi can run it. Nothing is ever deleted for good: files go to the
  Trash. Every change Pi makes is saved in git, so you can undo it.
- **Use it from your phone.** Open the workbench from your phone over [Tailscale](https://tailscale.com) and keep
  working away from your desk.
- **Use it in Japanese.** The whole interface, in the browser and in the terminal, can be in 日本語.
- **Or stay in the terminal.** Type `plh` and talk to Pi there, with the same Gate and the same projects.

<p align="center"><img src="docs/screenshots/workbench-phone.png" alt="The same chat on a phone" width="300"></p>

## Get started

You need a Mac, [Ollama](https://ollama.com) with a model, Python 3, [uv](https://docs.astral.sh/uv/), git, and
Pi's `pi` command. Linux and Windows are planned.

```sh
git clone https://github.com/KakkoiDev/pi-local-harness.git
cd pi-local-harness
python3 harness/install.py
plh
```

`plh` starts Pi in your terminal, and starts the workbench and Gate. Open **http://127.0.0.1:3000** in your browser,
choose **New Project…**, and say hello to Pi.

To stop everything, quit Pi (`/quit`, or Ctrl-C twice).

## Local classifier

On Apple Silicon with macOS 14 or newer, run `plh setup laya` to install the pinned multilingual Laya classifier
into the harness data folder’s toolchain. It downloads about 678 MB of model files and at most 80 MB of dependencies;
Python 3.12 and uv must already be installed. Requests never download a runtime or model.

Code decides first, then Laya; uncertain answers go to an existing choice card. Laya cannot approve a plan, accept a
task or change the phase. Use the explicit controls. Decisions record their author in `<data>/decisions.jsonl`;
model-proposed option ordering remains visible as a model recommendation. New benchmark records count each author,
while old records without provenance stay “Not recorded”. The first 40-case synthetic evaluation answered 12 cases
correctly and abstained on 28; it does not establish reliability on arbitrary requests.

## Music and sound effects

Ask Pi for a short track or sound effects, then ask for changes in the same chat.
It uses a curated Blips bank and Strudel patterns, and returns WAV audio
with editable source. Run `plh setup music` and install the Chip Pops `blips` CLI
and library first. Start with the uplifting composition pattern for melodies, chords,
bass and song sections. See [setup and limits](docs/music.md),
[using audio in your projects](docs/music-projects.md), and the
[LLM operating guide](harness/music/AGENT_GUIDE.md).

## Updating

Type `/update` in terminal Pi. It shows what is new, in plain words, and updates when you say yes. The next time
`plh` starts, it uses the new version. Then reload the page in your browser.

## Learn more

- [The guide](harness/GUIDE.md): questions and answers for everyday use. In the terminal, `/guide <words>` finds
  the answer.
- [How it works](docs/reference.md): install details, data and settings, the architecture, recovery.
- [Operations](harness/README.md): services, ports, the data folder, phone access.
- [The design](design/README.md): the Pi Workbench 1-bit design the interface follows, with every screen drawn.
- [Lessons](docs/lessons/README.md): mistakes the local model made, and what the workbench now does about each one.

## Contributing

Start with [docs/README.md](docs/README.md) and the [guide for coding agents](docs/contributing-for-agents.md).
Work is planned in [ROADMAP.md](ROADMAP.md), one task file per change in `tasks/`. Run the checks before each commit:

```sh
python3 tests/verify_workflow.py
```

The screenshots above come from a scratch workbench with sample data. Re-make them with
`node docs/screenshots/make.cjs` (desktop and phone; it needs Playwright) or `python3 docs/screenshots/make_phone.py`
(the phone one, with the headless shell from `plh setup browser`).
