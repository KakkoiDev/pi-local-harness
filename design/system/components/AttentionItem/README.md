# AttentionItem

**Existing vs Proposed:** Proposed (round 17, plan 354). It links to existing cards (ChoiceCard, PlanCard, CheckInCard, Activity's failure detail); none of those change, except that a replaced ChoiceCard gets a HarnessNotice and a disabled Answer with its reason.

One thing that waits for the person, in WorkOverview's **Needs you** list: what kind, which project and request, what happened in one sentence, when, and where to go. The whole item is one link. It has no answer, approve, continue or retry control. Boards: R17_Overview, R17_OverviewFollow, R17_OverviewWindows, R17_OverviewHistory, R17_OverviewStates, Ph17_Overview. CSS: `scripts/round17_a.css` (`.pw-attnlist`, `.pw-attn`, `__kind`, `__where`, `__project`, `__req`, `__text`, `__end`, `__open`).

## Anatomy

```html
<li><a href="/p/pong/chat?request=req-1410#card-q1" class="pw-attn" id="attn-choice-pong-req-1410-q1" tabindex="0"
       aria-label="Pong: Waiting for your answer. Request 14:10 · Question 1 of 2. Open Question" aria-describedby="attn-…-t">
  <span class="pw-attn__kind">{glyph}Waiting for your answer</span>
  <span class="pw-attn__where"><span class="pw-attn__project" title="Pong">Pong</span><span class="pw-attn__req">Request 14:10 · Question 1 of 2</span></span>
  <span class="pw-attn__end"><time>14:12</time><span class="pw-attn__open" aria-hidden="true">Open Question ›</span></span>
  <p class="pw-attn__text" id="attn-…-t">Pi asked whether the ball should speed up after each hit.</p>
</a></li>
```

The `id` is the attention id from the projection (stable across updates and windows); focus is kept by it.

## Kinds (in this order)

| Kind | Glyph | Word | Opens | Lands on | Leaves when |
| --- | --- | --- | --- | --- | --- |
| question | Q | Waiting for your answer | **Open Question** | project chat at the request, the ChoiceCard focused | answered (card, typed answer, any window) |
| plan | plan | Plan waiting for approval | **Open Plan** | chat, PlanCard (Start Building / Plan Another Task / Change…) | Start Building, or the plan is replaced |
| checkin | checked box | Task ready to check | **Open Check-in** | chat, CheckInCard (Continue / Review First / Stop Here) | Continue or Stop Here |
| failed | stop | Stopped by an error | **Open Request** | Activity detail of that request (reason, Ask Pi to Retry…) | a retry of it succeeds; then history "Recovered at 14:52" |
| interrupted | broken line | Interrupted by a restart | **Open Request** | Activity detail of that request | a retry succeeds, or you cancel it |
| service | plug | Service problem | **Open Details** | Activity's service detail ("Ollama stopped answering at 14:24") | the service answers again |

Project for a service item: "All projects". A Gate refusal Pi recovered from is never an item.

## States

| State | What changes |
| --- | --- |
| Rest / hover | wash on hover |
| Focused (roving) | 2 px ink ring inside (`:focus-visible`, `[data-focus]` on boards) |
| Opened from here (`aria-current=true`) | inverted until another item is opened; opening never resolves it |
| Replaced (`[data-replaced]`) | word "Replaced", label **Open the Newer Question**, sentence "Pi replaced this question at 14:40. The item opens the newer one; the old one can’t be answered." time = replacement time |
| Stale (`[data-stale]`) | word + " at 14:20", Open label dotted |
| Leaving (`[data-leaving]`) | 45 % for 2 s, `tabindex=-1`, then removed; announcement "Pong: answered. 4 need you." |
| Project moved to Trash | its items are removed with it (the row says so) |

## Copy (EN / JA)

| English | 日本語 |
| --- | --- |
| Waiting for your answer | 回答待ち |
| Plan waiting for approval | プランの承認待ち |
| Task ready to check | タスクの確認待ち |
| Stopped by an error | エラーで停止 |
| Interrupted by a restart | 再起動で中断 |
| Service problem | サービスの問題 |
| Open Question · Open Plan · Open Check-in · Open Request · Open Details | 質問を開く · プランを開く · 確認を開く · リクエストを開く · 詳細を開く |
| Replaced · Open the Newer Question | 置き換え済み · 新しい質問を開く |
| Request {time} · task {n} {title} | リクエスト {time} · タスク {n} {title} |
| {status} at {time} | {time} 時点で{status} |
| {project}: answered. {n} need you. | {project}：回答済み。対応待ち {n} 件。 |

## Data

`{"id","kind","project_id","project_name","request_id","request_at","label","text","at","target":{"view","request_id","card_id"},"replaced_by"}`. `text` is a fixed template filled from records (exit code, test counts, restart time), never model prose. Doesn't exist yet: `replaced_by`, the restart record per request, and the service item.

## Disabled reasons

None: an item is a link and always opens something. When the target no longer exists (request deleted), it opens Activity with "This request is no longer recorded." and the item leaves.

## Focus order and return

One Tab stop for the list; ↑↓ Home End; Return or click opens. Return path: the project chat shows "‹ Overview" (`#overview-return`, "Back to Overview") in its infobar; it returns focus to the same item id, or the next one if it left.

## Keyboard

Return opens; ⌘Return (Ctrl+Return) opens in a new browser window. No Space action, no Delete: an item can't be dismissed.

## Live announcements

Polite, once per change: "{project}: answered.", "…: plan approved.", "…: continued.", "…: recovered.", "…: waiting for your answer." (new item). The count follows: "4 need you."

## Phone

44 px minimum; stacked: kind, project + request, sentence, then time and the Open label (a 28 px line box inside the 44 px row). Tapping anywhere on the item opens it.

## Don't

- Don't add Answer, Approve, Continue, Retry or Dismiss to the item.
- Don't mark the item read or remove it when it's opened.
- Don't link a replaced question to the old card.
- Don't write the sentence with the model.

## Walkthrough

- Given Pong's question was replaced at 14:40, When I open "Pong: Replaced. Request 14:10 · Question 1 of 2. Open the Newer Question", Then Pong's chat shows "This question was replaced at 14:40 by a newer one, below." and focuses the newer card; the old card's Answer is disabled, described by "Replaced at 14:40: answer the newer question."
- Given Class Notes Request 13:50 "Stopped by an error", When I press "Ask Pi to Retry…" in Activity and the retry passes, Then the item leaves with "Class Notes: recovered." and Recorded problems shows "Recovered at 14:52".
- Given two windows, When I answer in window 1, Then the item leaves in window 2 and focus moves to the next item; after reload it stays gone.

## Open product choices

1. ⌘Return to open in a new window: keep, or leave to the browser?
2. Should an interrupted request that you cancel stay in Recorded problems? Drawn: yes, as "Cancelled by you".

## Round 18 · Proposed: order, focus stability, ⋯, service first (decisions 1, 3, 4, 6, 7)

- **Order.** Kinds in round 17 order (question, plan, check-in, failed, interrupted, service); within a kind **oldest first**. A *work-blocking* service problem is first of all, as `Service problem · Ollama stopped` → **Open Details** (`[data-blocking]`, 2 px frame); non-blocking ones (e.g. "Service problem · Preview stopped") stay in the service place (last) and only add to the count. Unresolved items never leave by age (an 11 Oct question is still listed, first in its kind).
- **⋯ (visible equivalent of ⌘Return).** `li.pw-attnrow` holds the link and `button.pw-rowmore[aria-haspopup=menu]` "More for {project}: {kind}". Menu: **Open {X}** (Return) · **Open in New Window** (⌘Return / Ctrl+Return). No Ask About on items (decision 13). → from the item reaches ⋯, ← returns. The link carries `aria-keyshortcuts="Meta+Enter Control+Enter"`.
- **⌘Return / Ctrl+Return** on the focused item opens its target in a new browser window; focus stays here. Never bound in a composer. Blocked: WorkOverview's inline notice (Open Here · Copy Link).
- **Focus stability.** A live update never moves the focused item: new items are inserted around it, and if one lands above, the list scrolls by its height so the focused row keeps its place. One polite announcement per update: "1 new item in Needs you" ("{n} new items in Needs you"). New items carry `[data-new]` ("New" tag after the request) until focused or 60 s. When the focused item resolves: fade 2 s, focus to the next item (else previous, else the heading), announcement "{project}: answered" (or "plan approved", "continued", "recovered", "cancelled").
- **Interrupted → cancelled.** Activity's detail gains **Cancel Request…** for interrupted requests (alert "Cancel this interrupted request?", default **Keep Request**). Cancelling removes the item ("pi-local-harness: cancelled") and leaves the history row "Cancelled by you · 14:40" + "Changes made before the restart are still in the project."

| English | 日本語 |
| --- | --- |
| Service problem · Ollama stopped | サービスの問題 · Ollama 停止中 |
| Open in New Window | 新しいウインドウで開く |
| 1 new item in Needs you | 対応待ちに新しい項目が 1 件 |
| {project}: answered | {project}：回答済み |
| {project}: cancelled | {project}：キャンセルしました |
| Cancelled by you · {time} | あなたがキャンセル · {time} |
| Changes made before the restart are still in the project. | 再起動前に行われた変更は、プロジェクトに残っています。 |

Superseded round 17 text (old → new): "Kinds (in this order) … service" last → blocking service first; "{project}: answered. {n} need you." → "{project}: answered"; "New attention: 'Pong: waiting for your answer.'" → "1 new item in Needs you"; Keyboard "⌘Return (Ctrl+Return) opens in a new browser window" now has the visible ⋯ › Open in New Window; Open product choices 1–2 → resolved (decisions 6, 7).

Walkthrough: Given focus is on home-server's check-in, When a Class Notes question arrives, Then it lists after Pong's question, focus and position stay, and "1 new item in Needs you" is announced once; When the focused Class Notes question is answered in another window, Then focus moves to the next item and "Class Notes: answered" is announced.
