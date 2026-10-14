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

## What it really was (2026-10-15)

The scroll analysis above was a reasonable first guess, but the thread itself came back at its newest message. What
lifted was the **desk**, the area behind the windows. `#chat-announce` (the hidden line that announces new messages to
screen readers, `.pw-sr-only`, `position:absolute`) sits inside `#thread` after the messages. Between 761 and 1100px
wide `#desk` is `position:relative` (tablet layout), so the announcer was positioned against the desk, below the whole
conversation (2392px tall in a 740px desk). The desk, `overflow-x:auto` and so scrollable both ways, then had that much
to scroll; any scroll into view (sending, Open in Chat) moved it, lifting every window and leaving empty desk below.
Reproduced in the browser pane at 1024px: after sending, `#desk.scrollTop` was 205.

## Plan

- [x] Red (browser, `tests/browser/chat.cjs`, at 1024×560 with a conversation taller than the thread): a running
      answer's **Show in Activity**, then **Open in Chat**; nothing around the thread is scrolled, the desk has nothing
      to scroll (it had 418px), the thread is at its newest message and the answer being written is in view.
- [x] `chat.css`: `#thread{position:relative}`, so the announcer is placed and clipped inside the thread.
- [x] Seen in the browser pane at 1024px: after sending and after the Activity round trip the desk stays at 0.
- [x] Not needed: the first attempt's changes to `showView` and `showMessage` (restore a saved scroll, scroll to the
      bottom) treated the thread, which was not lifted. Its test clicked "Open in Chat" on a whole-file request (whose
      button is "Show in Review") and could not pass with or without the change; it was never run.

## Notes

- The link label in code is **Open in Chat** (user-facing "See chat"); the forward link is **Show in Activity**.
  Task 157 implemented this round trip.
