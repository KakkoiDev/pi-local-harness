# PlanCard

The plan, waiting for a yes. Nothing is built until it is approved (or Run on its own approves it). Boards: R10_Plan, R10_PlanStates, Ph10_Plan.

- Head: plan glyph, “Plan: <project>”, “4 tasks · 4 decisions”. Body: the Goal (text face, one or two sentences); **Tasks** as an `ol.pw-plan__tasks`, each title with `small` “Done when …”; **Decisions** as `ul.pw-plan__decisions`: ✓, the name in bold, the value, a tag `chosen` / `given` / `auto` (dotted).
- Foot: **Approve Plan** (default), **Change…**, and at the right **Open the Plan** (ROADMAP.md in Work).
- **Change…** puts “What should change in the plan?” in the composer (Send Change). Pi answers with Plan v2; v1 collapses to one dim line “Plan v1 · replaced by v2 at 14:10 (…)” with Show.
- Up to 7 tasks on the card; beyond that the first 5 and “and N more tasks · Open the Plan”. Decisions are always shown in full.
- **Approved**: one settled line “✓ Plan approved · 4 tasks · 4 decisions · by you · 14:12 · Open the Plan”, or with the dotted `auto` tag.
- In Work, the task file's `Plan approved:` line renders as a quiet ✓ line under the title, and each decision's state as a tag; the source stays Markdown (R10_Work).

## Round 11: the plan's foot (replaces Approve Plan)

- When Planning is ready the foot is **Start Building** (default: approves the plan and moves the project to Implementation) · **Plan Another Task** (keeps the plan waiting, back to Discussion) · **Change…** (stays in Planning) · **Open the Plan**. A help line above the foot says what the first two do. **Approve Plan is removed**: Start Building is the only approval, here or in the waiting review.
- Settled: “Plan approved: building · 4 tasks · Start Building · you · 14:12”; “Plan waiting · 4 tasks, not started · Plan Another Task · you”; with Run on its own, “Plan approved: building” + dotted auto tag.
- **Tasks waiting** in Discussion: a `.pw-waiting` strip above the composer, “4 planned tasks wait: Write and keep notes, Subjects, and 2 more”, Open the Plan, **Build the Planned Tasks…**. The review (dialog on the desk, sheet on the phone): “Build the planned tasks?”, each task as a checkbox with its Done when (all checked), “The project moves to Implementation. Pi builds the checked tasks in order and waits for you to check each one. Unchecked tasks stay waiting.”, Open the Plan; Cancel · **Start Building** (disabled with “Choose at least one task” when none is checked).
