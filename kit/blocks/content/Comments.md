# Comments

App Block card (Content). A comment thread under a page, post or item: who said what and when, one level of replies, and a box to write a new comment.

- Basecoat: `avatar`, `textarea`, `btn`, `dropdown-menu`, `badge`, `empty`, `field`
- Route: inside a page (`#comments`)
- Needs: Web: `GET /posts/{id}/comments`, `POST /posts/{id}/comments`, `PATCH /comments/{id}`, `DELETE /comments/{id}`. No server: `store.comments(postId)`, `store.addComment(c)`. Needs Log in and accounts to know who writes (no server: one local person).
- Links to: Mentions, Reactions, Threads (chat-style replies), DeleteUndo, AppForum, AppCode, IssueDetail

## Markup
Copy, never retype: `{harness}/kit/blocks/content/Comments.html` (51 lines of HTML).

Replies are one level deep: a reply to a reply goes into the same list, starting with `@Name` (Mentions).

## States
- Thread (default): Oldest first; replies under their comment.
- No comments: `<p class="text-muted-foreground text-sm" data-t="comments.empty">No comments yet. Start the conversation.</p>` above the form.
- Sending: The send button `disabled aria-busy="true"`, text `comments.sending`; the comment appears at once with `opacity-60` and `comments.sending` instead of the time.
- Send failed: The pending comment shows `comments.failed` in `text-destructive` with **Retry** and **Delete**; the text is kept.
- Replying: **Reply** sets `aria-expanded="true"` and shows a small form (same as the main one, `id="reply-81"`) under that comment, focused.
- Your own comment: The ⋯ menu adds **Edit** and **Delete**; edited comments show `comments.edited` after the time.
- Deleted: With replies: the text becomes `comments.deleted` in `text-muted-foreground italic`; without replies it disappears with an Undo toast.
- Logged out: The form is replaced by `comments.login_to_comment` with a **Log In** link (LogIn).
- Long thread: After 20 comments: `comments.show_more` loads older ones (button above the list).
- New comment from someone else: With Presence: it appears at the end with a short `bg-muted` highlight; nothing jumps above the reader's position.
- Times: `<time>` shows `comments.time.minutes` under an hour, `comments.time.hours` under a day, then the date (`Intl.DateTimeFormat`).

## Texts
(Key | English | 日本語)
- `comments.title`: Comments | コメント
- `comments.reply`: Reply | 返信
- `comments.more`: More for {name}’s comment | {name} さんのコメントのメニュー
- `comments.copy_link`: Copy Link | リンクをコピー
- `comments.report`: Report… | 報告…
- `comments.edit`: Edit | 編集
- `comments.delete`: Delete | 削除
- `comments.author`: Author | 投稿者
- `comments.replies_to`: Replies to {name} | {name} さんへの返信
- `comments.new_label`: Write a comment | コメントを書く
- `comments.placeholder`: Write a comment… | コメントを書く…
- `comments.hint`: ⌘Return to send | ⌘Return で送信
- `comments.send`: Comment | コメントする
- `comments.sending`: Sending… | 送信中…
- `comments.failed`: Not sent. | 送信できませんでした。
- `comments.retry`: Retry | 再試行
- `comments.edited`: (edited) | （編集済み）
- `comments.deleted`: This comment was deleted. | このコメントは削除されました。
- `comments.empty`: No comments yet. Start the conversation. | まだコメントはありません。最初のコメントを書きましょう。
- `comments.login_to_comment`: Log in to comment. | コメントするにはログインしてください。
- `comments.show_more`: Show {count} earlier comments | 以前のコメントを {count} 件表示
- `comments.time.minutes`: {n} min ago | {n} 分前
- `comments.time.hours`: {n} h ago | {n} 時間前

Older than 7 days: the date from `Intl.DateTimeFormat` (“12 Oct” / “10月12日”); the full date and time are in `title` on the `time`.

## Keyboard and focus
1. Per comment: the time link → Reply → ⋯ ; then its replies the same way → 2. the comment box → 3. Comment.
- ⌘Return / Ctrl+Return sends from the box; Esc in a reply box closes it and returns focus to that Reply button.
- After sending, focus stays in the (now empty) box; the new comment is announced by an `aria-live="polite"` region (`comments.live.sent`: “Comment sent.” / “コメントを送信しました。”).

## Phone
- Same layout; avatars stay `sm`, reply indentation is 12 px (`pl-3`).
- The box is at the end of the thread, not fixed; tapping **Reply** scrolls the reply form into view above the keyboard.
- Buttons in the footer become 44 px tall (`data-size="xs"` buttons get `@max-3xl:min-h-11`).

## Data
```json
{"post_id": 7, "count": 3,
 "comments": [{"id": 81, "author": {"id": 5, "name": "Ren Sato", "initials": "RS"}, "body": "Could we add the reading in hiragana under each kanji?",
               "created_at": "2026-10-18T09:12:00+09:00", "edited": false, "deleted": false,
               "replies": [{"id": 82, "author": {"id": 3, "name": "Aiko Kato", "initials": "AK", "is_post_author": true}, "body": "Good idea, added.", "created_at": "2026-10-18T09:40:00+09:00"}]}]}
```

- Web: `POST /posts/7/comments` with `body` (and `parent_id` for a reply) → 201 with the thread fragment; 422 when empty or over 2,000 characters; 401 when logged out.
- No server: `store.addComment({postId: 7, parentId: 81, body})`.
- Bodies are plain text with line breaks and @mentions; escape everything, turn URLs into links with `rel="nofollow noopener"`.

## Don't
- Don't nest replies more than one level.
- Don't render comment bodies as HTML or Markdown.
- Don't put the comment box above the thread on long pages without also keeping one at the end.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Comments` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
