# 321: Show Preview ports and open more browser windows

Kind: code

Owner request: see the Preview port and open a second or more browser windows for multi-user feature tests; include this in Claude's report.

- [ ] Obtain the design for these additions before implementation (owner clarification).
- [ ] Red: browser regression for the visible address and repeated opening of the guarded app.
- [ ] Show the browser Preview address/port and the app-server port when different; preserve page/language when opening windows.
- [ ] Explain that independent accounts require separate browser profiles/private sessions; keep stopped/terminal controls accurate.
- [ ] Run workflow and complete browser checks, update Claude's report, commit, push and build.

## Scenarios

### US-new the Preview shows its address and port, and the app server’s port when it differs
Given a project whose app runs in the Preview
When I look at the Preview
Then its address and port are shown, and the app server's port too when it is different

### US-new opening the Preview in a new window keeps the page and language, as many times as I like
Given the Preview on a page of the app in Japanese
When I open it in a new window twice
Then each window shows the same page in Japanese, and the Preview controls still say whether the app is running

### US-new the Preview explains that a second account needs a private window or another browser profile
Given the Preview with a second window open
When I look for how to test as two users
Then the Preview says independent accounts need a private window or a separate browser profile
