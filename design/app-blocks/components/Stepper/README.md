# Stepper

Show where the person is in a task of a few ordered steps (checkout, sign-up, setup) and let them go back to a finished step.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | none for the step list (an ordered list with Tailwind utilities); `btn` for Back / Next, `card` around the step |
| Needs | The steps and which are done. No script beyond showing the current step |
| Used in | Checkout, Onboarding, SignUp (long forms), AppCourse (lesson progress), Invite |

Three to six steps. More than six, or steps that branch: split the task. One step per screen; never show two steps' fields at once.

## Markup

```html
<nav aria-label="Checkout steps" data-t-label="steps.label">
  <ol class="flex items-center gap-2 text-sm">
    <li class="flex items-center gap-2" data-state="done">
      <a href="/checkout/address" class="flex items-center gap-2 rounded-md px-1 py-1 hover:underline">
        <span class="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span><span class="sr-only" data-t="steps.done">Done:</span> <span data-t="checkout.step.address">Address</span></span>
      </a>
    </li>
    <li aria-hidden="true" class="h-px w-8 bg-border"></li>
    <li class="flex items-center gap-2 font-medium" data-state="current" aria-current="step">
      <span class="grid size-6 place-items-center rounded-full border-2 border-primary text-xs" aria-hidden="true">2</span>
      <span data-t="checkout.step.payment">Payment</span>
    </li>
    <li aria-hidden="true" class="h-px w-8 bg-border"></li>
    <li class="flex items-center gap-2 text-muted-foreground" data-state="todo">
      <span class="grid size-6 place-items-center rounded-full border text-xs" aria-hidden="true">3</span>
      <span data-t="checkout.step.review">Review</span>
    </li>
  </ol>
  <p class="sr-only @max-3xl:not-sr-only @max-3xl:mt-2 @max-3xl:text-sm @max-3xl:text-muted-foreground" data-t="steps.count">Step 2 of 3</p>
</nav>

<!-- the step itself -->
<form class="card" method="post" action="/checkout/payment">
  <header><h1 class="text-lg font-semibold" data-t="checkout.step.payment">Payment</h1></header>
  <section class="grid gap-4"><!-- this step's fields --></section>
  <footer class="flex justify-between gap-2">
    <a class="btn" data-variant="outline" href="/checkout/address" data-t="steps.back">Back</a>
    <button class="btn" type="submit" data-t="steps.next">Continue</button>
  </footer>
</form>
```

The last step's button says what it does (“Place Order”, “Create Account”), never “Continue” or “Finish”.

## States

| State | What changes |
| --- | --- |
| Done | Filled circle with ✓, the name is a link back to that step (data kept). |
| Current | `aria-current="step"`, ring circle with the number, `font-medium`. |
| To do | Muted circle and name, not a link. |
| Error in a done step | Circle `bg-destructive text-white` with `!`; the name stays a link; `steps.fix` in `sr-only` (“Needs a fix:”). Shown when a later step finds a problem (address no longer deliverable). |
| Saving / moving on | Continue `disabled aria-busy="true"` with `steps.saving`. |
| Skipped (optional step) | Circle with `–`, name muted, link back still works. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `steps.label` | Checkout steps | 購入手続きのステップ |
| `steps.done` | Done: | 完了: |
| `steps.fix` | Needs a fix: | 修正が必要: |
| `steps.count` | Step {n} of {total} | ステップ {n}/{total} |
| `steps.back` | Back | 戻る |
| `steps.next` | Continue | 次へ |
| `steps.saving` | Saving… | 保存中… |
| `checkout.step.address` | Address | お届け先 |
| `checkout.step.payment` | Payment | お支払い |
| `checkout.step.review` | Review | 確認 |

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
