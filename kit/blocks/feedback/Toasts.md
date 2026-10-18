# Toasts

App Block card (Feedback). Short messages that confirm something just happened, bottom right on the desktop and bottom centre on the phone, gone after a few seconds.

- Basecoat: `toaster`, `toast` (JS: `basecoat.all.min.js`), `btn`
- Needs: The toaster once per page, outside `.app`, as the last child of `body`
- Used in: DeleteUndo, SavedState, AccountSettings, Invite, Cart and anywhere a result has no other place to show

## Markup
The toaster, once, in the base template:

Copy, never retype: `{harness}/kit/blocks/feedback/Toasts.html` (5 lines of HTML).

A toast from JavaScript (no-server apps, or after a fetch):

Copy, never retype: `{harness}/kit/blocks/feedback/Toasts.js` (7 lines of JS).

A toast from the server (htmx): return it out of band with the response:

Copy, never retype: `{harness}/kit/blocks/feedback/Toasts.2.html` (14 lines of HTML).

## States
- Success: `data-category="success"`, `role="status"`, check-circle icon, 3 s.
- Info: `data-category="info"`, info icon, 3 s.
- Warning: `data-category="warning"`, triangle icon, 5 s.
- Error: `data-category="error"`, `role="alert"`, 5 s; say what failed and offer Try Again as the action when it can be retried.
- With an action: One `data-toast-action` button (Undo, View, Try Again). Duration at least 6 s.
- Hover or focus: The timer pauses (Basecoat), and resumes on leave.
- Several: They stack upward, newest at the bottom; at most 3 visible, the oldest closes.
- Closing: `aria-hidden="true"`; it collapses, then is removed.
- Invitation sent: toast: `toast.invite_sent` (“Invitation sent to ren@example.com”), category success, from code.

## Texts
(Key | English | 日本語)
- `toast.saved`: Saved | 保存しました
- `toast.note_deleted`: Note deleted | ノートを削除しました
- `toast.copied`: Link copied | リンクをコピーしました
- `toast.invite_sent`: Invitation sent to {email} | {email} に招待を送信しました
- `toast.offline_saved_title`: Saved on this device | このデバイスに保存しました
- `toast.offline_saved`: It will sync when you’re back online. | オンラインに戻ると同期されます。
- `toast.error.save`: Couldn’t save. Check your connection. | 保存できませんでした。接続を確認してください。
- `common.undo`: Undo | 元に戻す
- `common.try_again`: Try Again | もう一度試す
- `common.view`: View | 表示

## Keyboard and focus
- Toasts never take focus. Screen readers hear them through `role="status"` (polite) or `role="alert"` (errors).
- The action is reachable with Tab: after the last element of the page, before the browser chrome. Undo must also exist elsewhere for keyboard users who can't reach it in time: ⌘Z / Ctrl+Z right after a delete (DeleteUndo).

## Phone
- Below 48rem the toaster spans the width with 16 px sides (`.toaster` is full width below `sm`); toasts sit above the BottomBar: give the toaster `class="toaster pb-20"` when the app has one.
- The action button is 24 px tall inside the toast, so the whole toast is also tappable for its action when there is exactly one.

## Data
```json
{"category": "success", "title": "Note deleted", "description": "“Week 3 · Vocabulary”", "action": {"label": "Undo", "onclick": "undoDelete('n_42')"}, "duration": 6000}
```

- Web: return the toast in an out-of-band swap into `#toaster` alongside the main fragment.
- No server: call `toaster.toast({...})` after the store resolves.

## Don't
- Don't leave Basecoat's `break-all` on toast descriptions: it splits English words mid-word. Server-rendered toasts put `class="break-normal"` on the `p`; for toasts built by `toaster.toast()`, add `.toast-content p { word-break: normal; overflow-wrap: anywhere; }` to the project's CSS.

- Don't use a toast for errors that block the person's task: those go next to the field or as an InlineAlert.
- Don't put two buttons in a toast, or links that lead to a form.
- Don't toast things the person can already see change (a checkbox ticking).

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Toasts` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
