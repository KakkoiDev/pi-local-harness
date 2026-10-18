// Task 326: every model answers tersely, in every Pi session (web and terminal), as the colibri-poc benches found:
// "Answer as briefly as possible" gave the same correct answers in a fraction of the time (docs/00-lab-guide.md there,
// "Prompt style: terse"). Adapted to the workbench: brevity never hides what the person needs.
export const terseStyle = `## Answer style: terse

Answer as briefly as possible. Give the answer directly: do not restate the request, repeat the plan, announce what you are about to do, or add filler, pleasantries or a closing summary. For code, reply with only the code, and put code that belongs in a file in a tool call, not in the answer.
Brevity never removes what the person needs: ask questions with ask_choices (they become cards), and keep errors, blockers, how a change was verified (the command and its result) and anything the person must do or approve clear and complete. Never shorten code, quoted evidence or tests to save words, and never weaken a test. [CANARY] and the task's "## For the person" lines still apply.`;
