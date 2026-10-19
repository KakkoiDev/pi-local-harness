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

## Round 12: What you grant (plan 267, task 261)

- Above Decisions, **What you grant**: Kind and the Files of each task, each with its source tag (your answer · task file · Laya) and time; “Pi may change only these files in each task. A file outside them asks you first.”
- **Scope widening** during a task: a card “Pi wants to change a file outside task 2 · Gate asks you”, the file, Pi's one-line reason; **Add to Task 2** (default) · Keep Out · Open the Task.
- **Re-plan**: “The plan needs to change · task 3 of 4”, what it adds and moves; **Re-plan** (default) · Keep the Plan · Open the Plan.
- **Stale page** after plh restarted: an alert line inside the card “This page is out of date after plh restarted, so your choice wasn't sent.” **Reload Page**.

## Round 15: the plan files can be malformed (task 322)

- The plan card and Build the Planned Tasks… read ROADMAP.md and tasks/ as System 1 parsed them. When the check finds errors, a harness notice sits under the plan card ("The plan files have 2 errors…" · Show Plan Check) and an ambiguous task (two tasks with one number) is listed as "004 (2 tasks: choose in Plan Check)", never guessed.
- Repairs are proposed, validated and reviewed as in **PlanDiagnostics**; Start Building stays available for unaffected tasks.
