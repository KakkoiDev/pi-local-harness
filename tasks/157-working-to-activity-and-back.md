# 157: From "working" to its activity, and back in one click

Kind: code

Request 2026-10-14: "harmonize the UX/UI so that when we see in the ui that the agent is working, we can always inspect the ongoing agent activity and from that agent activity, always have a 1 click button way to go back to the comments or chat."

- [x] Brief: `design/briefs/chat-orchestration.md` part A.
- [x] Re-sync the boards once drawn (task 163: A_FromChat, A_FromComment, A_FromFile, A_FromWorker, Ph_ActivityFromComment).
- [x] Red (browser, design.cjs): the chat's live message links to its request; the status button opens the running request; the thread reads "Pi is working on it · Show in Activity" with the link after the words; the Activity detail has a From line and one button back, Open in Chat (scrolls to and outlines the message), Show Comment (Work, the thread open) or Show in Review (the whole-file box open on that request); the whole-file card links to Activity. Older tests now expect the origin buttons (desk and phone).
- [x] The Agent section's Activity row also opens the running request (else the next waiting one).
- [x] Bug the person reported: the Activity detail's Result closed on its own (the detail is rebuilt as the request changes). It now stays open (design.cjs waits for a refresh). The same report showed "Open in Chatjapanese": the old desk/phone label pair, replaced by the origin buttons.
- [x] Not built: a link inside the Review head, which is a button (a link cannot sit inside one); the thread it opens has the link. The worker's Open in Chat + Show Task come with plan 156.
- [x] Green: both browser suites. An intermittent verify_workflow failure was found later (task 163): two tests raced the queue's worker; fixed.
