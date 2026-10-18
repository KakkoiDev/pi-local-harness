# Stepper

App Block card (Other elements). Show where the person is in a task of a few ordered steps (checkout, sign-up, setup) and let them go back to a finished step.

- Basecoat: none for the step list (an ordered list with Tailwind utilities); `btn` for Back / Next, `card` around the step
- Needs: The steps and which are done. No script beyond showing the current step
- Used in: Checkout, Onboarding, SignUp (long forms), AppCourse (lesson progress), Invite

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/Stepper.html` (33 lines of HTML).

The last step's button says what it does (“Place Order”, “Create Account”), never “Continue” or “Finish”.

## States
- Done: Filled circle with ✓, the name is a link back to that step (data kept).
- Current: `aria-current="step"`, ring circle with the number, `font-medium`.
- To do: Muted circle and name, not a link.
- Error in a done step: Circle `bg-destructive text-white` with `!`; the name stays a link; `steps.fix` in `sr-only` (“Needs a fix:”). Shown when a later step finds a problem (address no longer deliverable).
- Saving / moving on: Continue `disabled aria-busy="true"` with `steps.saving`.
- Skipped (optional step): Circle with `–`, name muted, link back still works.

## Texts
(Key | English | 日本語)
- `steps.label`: Checkout steps | 購入手続きのステップ
- `steps.done`: Done: | 完了:
- `steps.fix`: Needs a fix: | 修正が必要:
- `steps.count`: Step {n} of {total} | ステップ {n}/{total}
- `steps.back`: Back | 戻る
- `steps.next`: Continue | 次へ
- `steps.saving`: Saving… | 保存中…
- `checkout.step.address`: Address | お届け先
- `checkout.step.payment`: Payment | お支払い
- `checkout.step.review`: Review | 確認

## Keyboard and focus
1. Done steps' links (in order) → 2. the step's first field → … → Back → Continue.
- Moving to a new step puts focus on its heading (`tabindex="-1"` on the `h1`) so screen readers hear the step name; the page title becomes “{step} · {app}”.
- Browser Back goes to the previous step (each step has its own URL).

## Phone
- Below 48rem only the circles show, without names, plus the visible “Step 2 of 3” line: hide names with `@max-3xl:sr-only` on the name spans of done and to-do steps (keep the current step's name visible).
- Connectors shrink to `w-4`. Back and Continue sit side by side at the bottom of the card, each half width and 44 px tall.

## Data
```json
{"steps": [{"id": "address", "state": "done"}, {"id": "payment", "state": "current"}, {"id": "review", "state": "todo"}],
 "draft": {"address": {"postal_code": "150-0001"}, "payment": {}}}
```

- Web: each step is a route (`/checkout/address`); POST saves that step into a server-side draft and redirects to the next (`HX-Redirect`) or re-renders with errors (422). Going back never loses the draft.
- No server: the draft lives in the store under one key and the current step in the URL hash (`#payment`).

## Don't
- Don't let people jump ahead to a to-do step.
- Don't put the step list inside the form; it is navigation.
- Don't use a progress bar instead of named steps when there are names.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Stepper` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
