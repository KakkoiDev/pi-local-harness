// A bounded self-review by the selected local model. It cannot approve work or replace Gate/test evidence.
export const REVIEW_ROLES = Object.freeze({
  correctness: 'Act as a correctness reviewer. Read the actual diff and relevant surrounding code. Trace failure, cancellation and persistence paths. Fix concrete defects within the approved task scope.',
  validation: 'Act as a test reviewer. Match the task acceptance criteria to executed checks. Look for missing negative cases, isolation and regressions. Run meaningful missing checks; never call unrun checks passed.',
  scope: 'Act as a scope reviewer. Compare the result with the approved task and user request. Preserve approval, resource, workspace and privacy controls. Identify incomplete work and material limits honestly.'
});
export function taskReviewPrompt(model) {
  if (!/^gpt-oss:20b(?:$|[-:])/.test(model || '')) return '';
  return 'Before the harness finishes this task, perform one bounded self-review using these specialized roles in order. This is advisory review by the same model, not independent verification.\n\n'+
    Object.entries(REVIEW_ROLES).map(([name,prompt])=>`${name}: ${prompt}`).join('\n\n')+
    '\n\nRead the current task and diff first. Do not approve a plan, accept a task, widen permissions or bypass Gate. Keep repairs within the approved task. End with the result and checks actually run; do not ask for routine confirmation.';
}
