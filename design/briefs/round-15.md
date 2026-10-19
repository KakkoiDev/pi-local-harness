# Designer brief: recording, Preview windows, plan repair and visual results

Date: 2026-10-19. Requested by the owner to transmit to the designer. **Draft for design, not implemented UI.**
This adds to rounds 13/14; it does not replace their outstanding work. Please return local design-system cards,
canvas boards, EN/JA text tables, states, keyboard/focus rules and implementation notes. The owner will transmit this
brief and return the designs; no message has been sent automatically.

## Product and visual constraints

Pi Workbench is a local AI coding workbench. First make local AI able to build working apps across many needs;
performance and scaling of generated apps come later. Experienced engineers need projects ready to demonstrate,
share and ultimately ship. Beginners need to learn good tests, planning and project management while building a
portfolio. Use plain, terse language. Do not make people administer the agent's guardrails.

The application remains **Pi Workbench**. Its interface uses **Pi Workbench 1-bit**: the existing monochrome
Macintosh-style system, components, focus treatment and phone sheets. Preserve the existing three phases, menus,
chat drafts, queue and question cards. Do not add another chat or a parallel navigation system. Generated visual
assets may contain colour; the workbench chrome remains 1-bit.

System 1 (code + classifier) decides policy and workflow; the language model produces content. Only explicit person
controls approve a plan or change a phase, subject to existing Run on its own behavior. Never ask “How should Pi
proceed with this unclassified command?” or offer to weaken safety checks. A refusal names a checked alternative;
product questions concern the app the person is building.

Please prioritize **A and B**, then C and D. These are requirements and suggested board identifiers, not a prescribed
new layout. Reuse existing components where they fit; specify every new control before implementation.

## A. Action recording and Report a Problem (task 333)

### Why

When the person says “the button didn't work” or “動かない”, Pi needs the actions that led to the failure, without
making the person reconstruct a technical bug report. The reusable recorder and replay-test tools live in test-core;
Workbench supplies the Preview adapter, per-project history, context attachment and reporting interface.

### Design these journeys

1. Understand whether recent actions in this project's Preview are being recorded, what is retained locally and how
   to stop recording. Specify the default and first-use explanation explicitly; no invisible recording/consent state.
2. Perform a few app actions, then report a problem in ordinary chat. System 1 selects the recent flow for **that
   project only**. Show what Pi received in a compact, inspectable context attachment, including its time range and
   redaction. The person's message and the conversation must remain usable if recording is unavailable.
3. Use **Report a Problem…** (placement/menu for the designer to settle). Review a local draft, inspect the included
   evidence and remove optional material. Nothing is posted to GitHub or otherwise sent just by opening this view.
   An external submission, if offered, requires the person's explicit action and names the destination.
   Run on its own does not substitute for that report-submission consent.
4. Record a new reproduction when the old flow is absent, too old or insufficient; return to the chat without losing
   its draft, attachments or pending question. Distinguish preparing a report, saving a local draft and submitting it.

### Privacy and capability facts the design must respect

- Current test-core code records structural selectors and redacted input lengths. It does **not** retain raw typed
  text, element labels/IDs, arbitrary error text or full URL paths/queries. Password/token fields are excluded.
- Do not draw a checkbox that implies past typed text can be recovered: it cannot. If inclusion of typed text is
  designed, it needs an explicit, bounded **new reproduction** consent flow; secrets remain excluded even then.
  Show “not recorded” for historical text. Implementation of raw-text capture requires a separate review.
- Keep app-flow evidence separate from private harness chats, credentials and unrelated projects. No hidden inclusion
  of full logs. The review must identify the actual included items, not claim “all sensitive data removed”.
- A selected online model follows the existing model/data policy; do not promise all context stays local while an
  online model is selected. Report submission and chat context attachment are different actions.
- History is bounded and local; specify understandable retention, clear-history and disable states. Clearing uses
  the project's existing recoverable Trash rules. Do not promise durable storage from a mere “recording” indicator.
- Capture is currently a subset of DOM actions, not a complete video or an application/network trace; shadow DOM
  is not covered. Show missing evidence honestly rather than implying the entire session was captured.
- An exported replay is a **test draft**, not proof the app works. The converter deliberately fails until a real
  expected outcome is added and uses synthetic values for redacted fields.

Required states: recording off/on, no flow yet, flow available, expired history, Preview stopped/terminal app,
unsupported page, capture/delivery/storage failure, report draft saved, external submission unavailable/fails/succeeds.
A recording failure must never block the app, a chat message or a question answer. No new policy-choice card.

Suggested boards: `R15_Recording`, `R15_FlowContext`, `R15_ReportReview`, `R15_ReportFailure`, and `Ph15_*` equivalents.
Reuse PreviewWindow, ContextLine, Dialog/Sheet and HarnessNotice; specify any additional card.

## B. Preview address, ports and multiple browser windows (task 321)

### Why

The owner wants to see where the app runs and repeatedly open it in a browser to test multi-user features.

### Required behavior

- Show the usable Preview address/port. When the app-server port differs from the Preview proxy, distinguish them
  in plain language; do not present two unexplained numbers. Identify phone/tailnet addresses separately.
- Provide an action to open another browser window, usable repeatedly, preserving the app's current page and
  language. Specify its menu/toolbar placement, accessible name and whether any shortcut is appropriate.
- Explain briefly: ordinary windows usually share sign-in and storage. Independent users need a private session or
  a separate browser profile. Do not promise that opening a window creates an independent identity, or that the
  workbench can force a private window in every browser.
- Specify popup-blocked behavior with a working alternative. A remote phone must not be offered this Mac's
  `127.0.0.1` as a usable phone address. Preserve the existing guarded phone route.
- Starting, stopped, crashed, no app, missing packages and terminal-app states keep their existing meanings.
  Unavailable controls remain visible and disabled with a reason; a new window must not silently restart the app.

Required boards: running with different ports; second-window/account explanation; popup blocked; phone; terminal or
stopped. Suggested names: `R15_PreviewAddress`, `R15_PreviewUsers`, `Ph15_PreviewAddress`.

## C. Malformed roadmap/task diagnostics and bounded repair (task 322)

### Why

The supplied Pong example mixes detailed task sections into ROADMAP.md, has two different tasks numbered 004, and
shows some completed rows with unchecked historical Red steps. Escaping in a pasted message is not evidence that
those escape characters exist in the actual file. Diagnostics must come from the saved source.

### Required behavior

- Show precise **file + line** diagnostics from System 1, distinguishing definite structural errors, unsupported
  formats and advisory evidence inconsistencies. Preserve support for valid legacy Markdown.
- Let the person open the affected file/line, ask Pi to repair the documents, inspect the proposed change and return
  to the conversation. Explain when the current phase permits diagnosis versus writing; reuse phase controls.
- Two distinct tasks with one number require a clear product choice about identity; never silently discard or
  renumber one. A repeated identical link can be diagnosed separately from two different tasks.
- A checked Green and unchecked Red must not be “fixed” by inventing a past failing test. Explain the evidence gap.
- Repair preserves goals, requirements, links and history. Show a recoverable original and change review. If the
  file changed concurrently, keep the person's edit/draft and offer a fresh diagnosis; never overwrite it silently.
- A failed validation leaves the original intact. Repeated repair must not create duplicate tasks. No app code is
  edited as a side effect. System 1 validates the result; the model's claim of success is insufficient.

Required states: valid, errors plus warnings, unsupported format, ambiguous identity, repair preparing, review ready,
validation failure, concurrent edit, repaired/reloaded, restore original. Keep malformed files readable/editable.
Suggested boards: `R15_PlanDiagnostics`, `R15_PlanRepair`, `R15_DuplicateTask`, `Ph15_PlanDiagnostics`.

## D. Visual results inside chat (plan 266, visual-generation follow-up)

### Why

Music has an in-chat player. The person also wants to see icons/images Pi selected or generated, before accepting
and using them. Existing attachment viewing does not fully specify this result workflow.

### Required behavior

- A compact result preview in the agent's message, expandable for inspection, with name, source (chosen versus
  generated), dimensions/type and revision. Support transparent icons on a legible checker/light/dark backdrop.
- Distinguish a proposal, a generated file and an asset actually used in the app. State what a selection action does;
  viewing an asset never approves a plan, changes the phase or silently replaces a project file.
- Show revision history without overwriting earlier generated assets. Assets live under `assets/<kind>/<name>/`
  with numbered revisions; media-tool writes are the constitution's narrow phase exception.
- Cover generating, success, multiple candidates, unsupported file, missing/deleted file, failure and unavailable
  generation. Do not imply a new online generation service or download is already installed/approved.
- Provide useful accessible text for non-visual users, keyboard inspection and phone zoom/close behavior. Unsafe
  active content must not execute merely because it is previewed; specify the visible fallback.

Suggested boards/card: `R15_VisualResult`, `R15_VisualVariants`, `Ph15_VisualResult`, `VisualResult`.

## Deliverables and acceptance walkthroughs

For each area return:

- Desktop boards at 1440 and 1024 px and phone at 390 px; narrow-content behavior at 320 px.
- Cards documenting anatomy, states, EN/JA copy, data, disabled reasons, focus order/return, keyboard, live
  announcements, phone behavior and “Don't”. No shortcut that conflicts with browser-reserved shortcuts.
- Canvas index entries, implementation markup/classes/IDs, CSS additions and a precise list of changed earlier copy.
- A click-through walkthrough of its main journey and failure/recovery journey, with stable accessible names suitable
  for one Given/When/Then E2E test per story. Include reload and a second open Workbench tab.

The implementation must prove: a problem report never blocks chat; an answer still works with a recorder failure;
opening two Preview windows preserves route/language but does not claim independent accounts; malformed documents
remain recoverable after a stale repair; visual results are inspectable without applying them. Every control needs
an E2E step. Please flag unresolved product choices instead of hiding them in illustrative copy.
