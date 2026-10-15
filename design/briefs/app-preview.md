# Brief: the app, running beside the chat

Date: 2026-10-15. Plan: [docs/plans/198-one-stack.md](../../docs/plans/198-one-stack.md) ("Preview and undo for people who do not read code"; "The school"). Nothing is drawn or built yet.

The person: "I like the idea of having the preview in the pi harness directly."

## Who it is for

Someone who has never used AI to build software and does not read code. They ask Pi for an app ("a notes app for my class, in Japanese and English"), and what they judge is **the app itself**, not the diff. Today they would have to open a terminal, run a command and find a port. The workbench should show the app as soon as there is one, keep it current while Pi works, and let them try it on their phone.

## What exists, for reference

- The main window has two views: **Chat** (⌘1) and **Work** (⌘2), switched by the segmented control in the window's title bar. The project's folder path sits at the right of that bar.
- The **Phone dialog** (Settings → phone access) already draws a QR code for the workbench's tailnet address.
- Every request Pi finishes is **one commit** made by the harness, with a task file (tasks 187, G-013). An answer whose change was not verified carries a "Not verified" mark (G-012).
- New projects are made from **the starter** (task 200): a web app with a known run command (`uv run uvicorn app.main:app --reload`), English and Japanese, installable on a phone (PWA).
- The harness already drives a headless browser for Pi (task 188). That is Pi's eyes; this brief is the person's.

## What to draw

1. **The Preview.** The project's app, live, inside the workbench. A third view (Chat · Work · **Preview**, ⌘3)? Or a window beside the chat, so the person can talk and look at once (proposed: beside the chat on a wide screen, a view on a narrow one). Its bar:
   - the app's address path (editable, like a browser's: `/`, `/notes`), **Reload**,
   - a size switch: **Phone** (390 wide) · **Tablet** · **Full** — the same two sizes the harness checks pages at,
   - **Open in Browser**, **Open on Phone…** (the QR, reusing the Phone dialog's drawing),
   - the language the app is shown in (English · 日本語), since every starter app has both.
2. **Its states**, in plain words, state as glyph plus word:
   - Not started: "This project has no app to show yet." (A project that is not a web app: say what it is and dim the view, never hide the tab.)
   - Starting: "Starting the app…" (the first start installs things with uv: up to a minute).
   - Running: the app. A thin line when Pi changes files: "Pi changed 2 files. Reloaded." The app reloads itself; the line says so.
   - Stopped by an error: the app's last error line, in monospace, and **Ask Pi to Fix** (sends the error with a short note into the chat), **Start Again**.
3. **What was done, in plain words**, under each finished answer in the chat: two or three lines Pi writes for someone who does not read code ("Added a Delete button to each note. It asks first. Tried it: deleting one note keeps the others."), then **Show in Preview** and **Undo This Request…** (the request is a commit; undo makes a new commit that reverses it; an alert says what will change back, Cancel default).
4. **A lesson line**, at most one per answer, when the person meets an idea for the first time (from KakkoiSchool, in their language): "First commit in this project. New to git? **T19 Git Basics**, 10 min." Quiet, dismissable, "Don't show lessons" in Settings.

## Questions

- **Beside or a view?** And on the phone (one column), is Preview a sheet over the chat?
- **Who starts the app?** Proposed: the workbench starts it when the Preview is first shown and stops it when the project is closed; a Start / Stop pair in the bar for the person who wants control. Should it start even before the Preview is opened, so it is ready?
- **Undo wording:** "Undo This Request…" or "Take This Back…"? Undo of an older request when newer ones changed the same lines can fail: what does the alert say then?
- **The plain-words lines and the lesson line:** inside Pi's answer bubble, or a separate quiet row under it, like the Not verified mark?
- **Japanese UI:** the workbench itself will gain Japanese (plan 198). Any layout this brief introduces should take Japanese labels (longer or shorter) without breaking.
