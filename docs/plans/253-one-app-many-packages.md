# Plan 253: One application, several packages

Direction recorded 2026-10-18. Status: architecture proposal and acceptance plan; no exporter or runtime implemented by this document.

The person: “applications are all built the same way, but exported/packaged in different ways: full stack, front only, mobile, ...”

This develops [plan 198](198-one-stack.md) and the [Project Start direction](../handoff/claude-return-2026-10-17.md). The first goal is a local AI that can build a broad range of working apps. Performance and scalability of those apps follow later.

## One app to build and maintain

The person describes the app and chooses capabilities. The harness assembles tested blocks; the AI implements the novel behavior. The project has one canonical source, one domain model, one set of business rules, HTML templates and HTMX interactions, and one task/test history. A packaging target should not make the model rewrite the application in a different language or create an independently maintained copy.

Python and HTMX are the common foundation. Shared Python business logic should avoid direct dependencies on the filesystem, network transport, platform UI and a particular database connection. Platform effects go through small explicit interfaces. Templates and interaction contracts are shared where their behavior is equivalent. Browser/native bridges, when needed, belong to maintained adapters rather than ad hoc per-app code invented by the model.

This is a direction to prove, not a promise that arbitrary Python packages, every UI or every capability already work unchanged on all targets. The exporter must report unsupported requirements honestly. It must not silently replace Python business rules with a separately maintained JavaScript implementation.

## Capabilities and packaging are separate choices

Capabilities describe what the app does: authentication, dashboards, collaboration, collision detection, offline work and further reusable blocks. Packaging describes where it executes and how it is shared. GitHub Pages is a deployment destination for the browser-only artifact; it is not a separate kind of business logic.

| Target | Proposed execution arrangement | What the app keeps | What an adapter/package supplies |
|---|---|---|---|
| Full stack | Python on a host, HTML/HTMX in the browser | Domain rules, templates, contracts and relevant tests | HTTP transport, server storage, trusted secrets and deployment configuration |
| Frontend only | Python/WASM inside the browser; static assets hosted or distributed | The same supported domain rules, templates, contracts and tests | Browser execution bridge, interaction routing, local persistence and offline assets |
| Mobile | The same app presented as an installable web app or wrapped package, according to the required features | Shared app source and business behavior | Platform packaging, device interfaces and supported storage/transport adapters |
| Further targets | Add an adapter only after a concrete need and proof | The canonical source | Target-specific packaging and conformance checks |

The existing PWA-first direction remains the starting point for mobile; this proposal does not select or download a new mobile framework. A mobile interface and a backend are not mutually exclusive. A mobile package may use a hosted backend; a locally running browser package may optionally connect to a service. Export options must express those dependencies instead of pretending the rows are universally interchangeable.

## A concrete example

Build a notes app once: create a note, validate its title, choose a priority, list and edit it. Domain rules and fragment behavior are defined once. The full-stack package uses a server-side storage adapter; the browser-only package uses an approved browser persistence adapter while running the supported Python logic locally. Mobile reuses that app and supplies the required installation/device integration.

Changing the priority rule should change one source implementation. The same behavior tests must pass on every target that advertises the feature. Packaging must not mark the app complete merely because it produced files: verify a running artifact and its actual behavior.

## Boundaries that must be explicit

A browser Python runtime needs an adapter that executes Python, routes HTMX interactions and returns the expected HTML fragments. Calling it a “server inside the app” describes the desired developer experience; it does not prove conventional server processes or sockets can run unchanged. Runtime selection and package compatibility remain open until demonstrated.

Browser-only assets cannot contain a trusted secret. Authentication, payments and cross-device shared state need an explicit trust/service design. Selecting these blocks may require a backend or other approved service even when the client is statically hosted. Offline behavior must specify what works, where data persists and what happens on reconnect. These are correctness and capability questions, not premature scaling work.

Each block should declare required interfaces, compatible targets and acceptance tests. System 1 checks the selected combination and explains any unsupported requirement before export. The person chooses how to resolve a conflict. System 2 must not silently remove a feature, change the target or invent approval.

## Proof sequence before implementation is standardized

1. Define the shared app structure and minimal storage/interaction interfaces using one small Python/HTMX app. Keep domain logic separate from platform effects.
2. Prove the full-stack artifact: run it, exercise create/edit/reload, and verify its fragment and persistence behavior.
3. Prove the frontend-only artifact from that same source: execute a supported Python rule in the browser, submit one HTMX interaction, render its fragment, persist state, reload, and exercise the declared offline behavior.
4. Run common business-behavior cases against both adapters and end-to-end checks against both packaged artifacts. Change one business rule and demonstrate both packages reflect it without parallel implementations.
5. Prove the PWA/mobile path from the same app. Add a native wrapper/device integration only when the chosen capability needs it and the design/toolchain is approved.
6. Expand the block catalog and target combinations from working evidence. Address generated-app performance and scalability afterward, based on real usage needs.

These are proposed future implementation steps, not completed checkboxes. Downloads still require the person's yes. UI work requires local design specifications. A prototype must use scratch projects, not the person's existing apps. No deployment or new model benchmark is implied by this plan.

## What changes in the earlier plan

Plan 198's historical “Apps with no server at all” section specifies a second JavaScript-business-logic starter. The owner's new direction replaces that as the desired future architecture: frontend-only becomes an export target of the common Python/HTMX foundation. Existing static starters and applications remain as they are until a separately scoped migration is designed and approved.

Plan 198's benchmark-improvement condition is historical. Immediate success here means working capability across representative apps and packages, honest verification and recoverable building workflows. A performance comparison is not the entry gate for proving this architecture.

The false-completion and interaction defects in the [test-project review](../reviews/2026-10-17-test-project-log-review.md) remain unresolved. Publishing this architecture does not fix them or constitute approval of an implementation task.
