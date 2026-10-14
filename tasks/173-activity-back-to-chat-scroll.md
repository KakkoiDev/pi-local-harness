# 173: Coming back to Chat from Activity leaves the view lifted, with white at the bottom

Kind: bug

Report 2026-10-14: "When I'm in the chat view and I click *Show in Activity* next to the
agent's answer that's being created, then click *Open in Chat* ("See chat") to go back to
the chat, the view is lifted up. There is white at the bottom of the screen." Screenshot in
`image.png`.

## Reproduce

1. In a chat, send a request. While Pi's answer is being created, its live message shows a
   `· Show in Activity` link (`js/chat.mjs` `renderMessages`, the `[data-live]` article:
   `show.onclick = … workspace.openJob(live.id)`).
2. Click **Show in Activity**. `workspace.openJob` calls `host.showActivity()` → `showView('activity')`,
   which sets `#thread` to `hidden` (`js/chat.mjs` `showView`: `$('thread').hidden = next!=='chat'`).
3. In the Activity detail, click **Open in Chat** (the `.activity-detail__actions` back button built in
   `js/workspace.mjs` `renderJobDetail`: `openOrigin(job)`).
4. `openOrigin` → `goToProject(job.project, 'chat')` (→ `showView('chat')`) then
   `host.showMessage?.(job.message)` (`js/workspace.mjs` `openOrigin`).
5. The chat reopens lifted: the last messages are pushed out of the bottom, leaving white space.

## Root cause (to confirm)

- **The thread's scroll position is lost in Activity.** `#thread` is a flex scroll box
  (`#thread{flex:1;min-height:0;overflow:auto}`, `chat.css:38`). While Activity is shown it is
  `hidden` (`display:none`), and a hidden element's `scrollTop` resets to 0.
- **`showView('chat')` does not return the thread to the bottom.** Its only scroll effect is
  `resize()` (`js/chat.mjs:52`), which sizes the prompt box, not the thread.
- **`showMessage` re-anchors on the *user* message, centered.** `js/chat.mjs` `showMessage`:
  `const article=[...$('#messages').querySelectorAll('.pw-msg--user')].reverse().find(…===text);
   article?.scrollIntoView({block:'center'})`. The `· Show in Activity` link is on the *live
  assistant* answer; coming back centers on the matching user message above it, so the growing
  answer is pushed below the fold and `#thread` shows empty space at the bottom.
- `#messages` is fully rebuilt on return (`renderMessages`), and its `nearBottom` guard only
  snaps to the bottom when the content is short, so a long live answer does not.

## Expected

- Coming back from Activity restores the chat to where the request's answer is — the bottom of the
  thread (the live or last message), with no white gap below.
- The `· Open in Chat` / *Show in Activity* round-trip lands on the same request's answer, not a
  half-hidden user message.

## Plan

- [ ] Red (browser, `tests/browser/chat.cjs`, near the Activity round-trip at line 99): start a
      running request, click its live `Show in Activity`, open its detail, click **Open in Chat**;
      assert `#thread` is scrolled to (or within a small tolerance of) its bottom
      (`scrollTop + clientHeight ≈ scrollHeight`) with no hidden trailing space, and the answer
      message (the `.pw-msg--found` / last assistant message) is in view — not the user message
      centered with a gap.
- [ ] Preserve the thread's scroll position across `hidden`, or on `showView('chat')` after a
      project switch, scroll the thread to the bottom (`#thread.scrollTop = scrollHeight`) instead
      of leaving it at 0.
- [ ] In `showMessage`, reveal the request's *answer* (scroll the latest assistant/live message into
      view, or scroll to the bottom) rather than `scrollIntoView({block:'center'})` on the user
      message that can leave the answer off-screen.
- [ ] Confirm the `.pw-msg--found` outline still lands on the intended message after the fix.
- [ ] Grey: run `run.sh` / the chat browser suite; confirm the round-trip shows no white gap at the
      bottom across 320/390/768/1440 widths (reuses the width loop at `tests/browser/chat.cjs:240`).

## Files to touch

- `js/chat.mjs` — `showView`, `showMessage`, `renderMessages`
- `js/workspace.mjs` — `openOrigin`
- `chat.css` — only if the thread's scroll/size needs a rule
- `tests/browser/chat.cjs` — the Red assertion

## Notes

- The link label in code is **Open in Chat** (user-facing "See chat"); the forward link is
  **Show in Activity**. Task 157 implemented this round-trip; this bug is its scroll restoration.
