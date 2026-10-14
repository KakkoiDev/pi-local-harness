# 135: Thread and Review states, Show in Activity, whole-file answer cards

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [ ] Red (browser): a queued comment reads "Sent to Pi · waiting in queue · can no longer be deleted" (fixes: it read "not sent" until the job started) with Show in Activity; "Pi answered · HH:MM"; Review head words and glyphs; whole-file answers as cards; composer help "Comments stay with the file until you choose Ask Pi."
- [x] Decided: Ask Pi stays on an answered thread (follow-ups work).

Progress 2026-10-13 (the person: "had a comment conversation. Me -> Pi -> Me, but Pi didn't get my reply and the displayed order is wrong"):
- A thread is one conversation: replies carry an author (you or pi) and Pi's answers are appended in order (round 3: follow-up answers are appended, earlier ones stay). Older records with only `agent_reply` read in order: the answer goes after the replies written before the request was sent.
- The comment prompt gives the thread oldest first and asks Pi to answer the latest message.
- Ask Pi stays on answered threads and sends what is typed in the reply field with it; Reply alone only adds a note.
- State lines follow the latest request for the comment: waiting (· follow-up), working, answered · HH:MM, or could not answer.
- Then (the person: "comment … is not triggering the model … when sent in response to a thread and still show 'No unsent comments'"): once a thread went to Pi, Reply sends your message to Pi with the thread; Ask Pi shows on unsent threads and on threads with replies not yet sent. A thread with replies written after its last request counts as unsent ("Reply not sent to Pi" in Review, "Reply saved · not sent to Pi" in the thread) and goes with Send N Unsent.
- Then (the person: "should indicate in the comment ui that the model is treating this particular comment right now, like for the inline comments"): Review heads show the same live state as the thread, with its glyph: Waiting in queue, Pi is working on it, Pi answered, Pi could not answer, Reply not sent to Pi.
