# Round 19: closeout of revision e6b7b027

21 October 2026, owner-delegated. Recorded as supplied after the round 19 final follow-up decisions (`round-19-follow-up-decisions.md`). Where it lives in the design: `design/IMPLEMENTATION.md` › Round 19 › “Closeout of `e6b7b027`”, and `docs/handoff/round-19-design-2026-10-21.md`.

## Closeout of revision e6b7b027

The six subsequent questions are settled under the same delegated selection:

1. Remove from List failure: keep the item visible and offer Try Again. Use Couldn't remove “Class Notes”. State Nothing changed only when the host confirms no mutation. On an uncertain network result use Couldn't confirm removal. Check the list and try again. Reconcile host state before retry; do not report a false rollback or remove actual project files.
2. Fix the shared alert icon definitions to use the design system's semantic foreground/background colours in both themes, preserving intentional cutouts. Apply the repair consistently to cards, boards and exported design assets, not a one-board patch. Check contrast and unrelated icon rendering. Correct duplicate IDs in PhaseControl and PreviewWindow previews as design maintenance, updating references.
3. Draft timestamps: Saved denotes a host-confirmed save time only. Kept denotes a separately recorded preservation time. If only one timestamp exists, use a neutral Recorded label with its documented meaning, or omit the time. Never invent a saved/kept distinction. An unsaved buffer must not acquire a Saved label through remote deletion.
4. No Start New Flow button. Existing session/reproduction boundaries start flows. A full flow may leave recording enabled but is not actively capturing; show Flow full · no more actions saved and explain the existing ways to start a new session. Never show an unqualified Recording status while silently dropping all events.
5. Shared report drafts: show From: Shared profile on this computer and Anyone using this profile can see this draft. before editing/saving. This is profile scope, not a claim that authenticated personal profiles are shared. External submission still requires explicit payload review and confirmation.
6. Approve a version list for a single unsaved/conflicted version, with its real save state; a normal saved draft need not show conflict UI. Approve Removed from the list for the removed-projects Trash group; explain that this describes project registration and does not mean the user's files were deleted.

Treat these as final design corrections rather than a new design round. Update the existing round 19 cards, boards, copy and coverage table, fix the source of regenerated stale accessibility references, and report actual remaining defects. Do not claim that static checks verify backend behavior. No push or merge is implied by the decision record itself; use the existing authorized branch workflow.
