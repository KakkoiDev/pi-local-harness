# PlanCard

The plan, waiting for a yes. Nothing is built until it is approved (or Run on its own approves it). Boards: R10_Plan, R10_PlanStates, Ph10_Plan.

- Head: plan glyph, “Plan: <project>”, “4 tasks · 4 decisions”. Body: the Goal (text face, one or two sentences); **Tasks** as an `ol.pw-plan__tasks`, each title with `small` “Done when …”; **Decisions** as `ul.pw-plan__decisions`: ✓, the name in bold, the value, a tag `chosen` / `given` / `auto` (dotted).
- Foot: **Approve Plan** (default), **Change…**, and at the right **Open the Plan** (ROADMAP.md in Work).
- **Change…** puts “What should change in the plan?” in the composer (Send Change). Pi answers with Plan v2; v1 collapses to one dim line “Plan v1 · replaced by v2 at 14:10 (…)” with Show.
- Up to 7 tasks on the card; beyond that the first 5 and “and N more tasks · Open the Plan”. Decisions are always shown in full.
- **Approved**: one settled line “✓ Plan approved · 4 tasks · 4 decisions · by you · 14:12 · Open the Plan”, or with the dotted `auto` tag.
- In Work, the task file's `Plan approved:` line renders as a quiet ✓ line under the title, and each decision's state as a tag; the source stays Markdown (R10_Work).
