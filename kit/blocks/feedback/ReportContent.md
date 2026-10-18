# ReportContent

App Block card (Feedback). A dialog to report a post or comment to the moderators: pick a reason, add details if needed, send, and see that it was received.

- Basecoat: `dialog`, `field`, `fieldset`, `label`, `input` (radio), `textarea`, `btn`, `alert`, `dropdown-menu`
- Route: none (a dialog over the post); moderators see reports at `/moderation`
- Needs: Web: `POST /reports` (`target_type, target_id, reason, details`). Needs a server (reports go to people who moderate).
- Links to: Comments, Threads, Channels (the ⋯ menu that opens it), Toasts, ConfirmDialog, AppForum

## Markup
Copy, never retype: `{harness}/kit/blocks/feedback/ReportContent.html` (34 lines of HTML).

After sending (in the dialog, and the line under the post only the reporter sees):

Copy, never retype: `{harness}/kit/blocks/feedback/ReportContent.2.html` (7 lines of HTML).

## States
- Open: Focus on the first reason; nothing chosen.
- No reason: On Send: `#report-reason-error` shows, the fieldset gets `aria-invalid="true"`, focus moves to the first radio.
- “Something else” without details: `#report-details` gets `aria-invalid="true"` and its help text becomes `report.error.details` in `text-destructive`.
- Sending: **Send Report** gets `disabled aria-busy="true"` and text `report.sending`.
- Sent: The form is replaced in the dialog by a `section` with `report.sent.title` and `report.sent.body`, and one button **Done** (`report.done`). The post gets a quiet line under it: `report.sent.line` (only the reporter sees it).
- Already reported: The menu item reads `report.already` and is `aria-disabled="true"`; opening is not possible.
- Own post: The menu has no Report item.
- Error: An `alert` with `data-variant="destructive"` above the form: `report.error.send`; the choices are kept.
- Offline: Send is disabled; the alert says `report.error.offline`.

## Texts
(Key | English | 日本語)
- `report.open`: Report… | 報告…
- `report.title`: Report this post | この投稿を報告
- `report.lede`: Moderators will look at it. The person who wrote it won’t see who reported it. | モデレーターが確認します。投稿者には誰が報告したかは伝わりません。
- `report.reason`: Why are you reporting it? | 報告する理由は何ですか？
- `report.reason.spam`: Spam or advertising | スパムまたは宣伝
- `report.reason.harassment`: Harassment or hate | 嫌がらせまたは差別的な内容
- `report.reason.personal`: Shares someone’s personal information | 個人情報が含まれている
- `report.reason.off_topic`: Off topic or in the wrong place | 話題が違う、または場所が違う
- `report.reason.other`: Something else | その他
- `report.details`: Details (optional) | 詳細（任意）
- `report.details_help`: Required for “Something else”. Up to 500 characters. | 「その他」の場合は必須です。500文字以内。
- `report.cancel`: Cancel | キャンセル
- `report.send`: Send Report | 報告を送信
- `report.sending`: Sending… | 送信中…
- `report.done`: Done | 閉じる
- `report.sent.title`: Thanks, we got your report | 報告を受け付けました
- `report.sent.body`: A moderator will look at it, usually within a day. You don’t need to do anything else. | 通常1日以内にモデレーターが確認します。ほかに必要な操作はありません。
- `report.sent.line`: You reported this on {date}. | {date}に報告しました。
- `report.already`: Reported | 報告済み
- `report.error.reason`: Choose a reason. | 理由を選んでください。
- `report.error.details`: Tell the moderators what’s wrong. | どのような問題か入力してください。
- `report.error.send`: The report couldn’t be sent. Try again. | 報告を送信できませんでした。もう一度お試しください。
- `report.error.offline`: You’re offline. Connect to send the report. | オフラインです。接続してから送信してください。
- `dialog.close`: Close dialog | ダイアログを閉じる

## Keyboard and focus
1. the reasons (one Tab stop, ↑ ↓ choose) → 2. Details → 3. Cancel → 4. Send Report → 5. Close.
- Esc closes and focus returns to the ⋯ button of the post. After **Done**, focus returns there too.

## Phone
- The dialog takes the full width with 16 px sides; radios are 44 px rows (App foundations).
- The menu item is the same; long-press on a post opens that menu.

## Data
```json
{"request": {"target_type": "post", "target_id": 812, "reason": "harassment", "details": ""},
 "ok": {"id": 55, "status": "received", "created": "2026-10-18T10:20:00+09:00"},
 "error": {"code": "invalid | duplicate", "fields": {"reason": "report.error.reason"}}}
```

- Web: `POST /reports` → 201 with the “sent” fragment, 422 with field errors, 409 `duplicate` (show the already-reported state).
- One report per person per post; reports never change the post until a moderator acts.

## Don't
- Don't show the reporter's name to the author or say how many reports a post has.
- Don't hide the post automatically after a report.
- Don't add a free-text-only form; the reasons let moderators sort reports.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ReportContent` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
