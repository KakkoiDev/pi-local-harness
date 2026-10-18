# Comments

A comment thread under a page, post or item: who said what and when, one level of replies, and a box to write a new comment.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `avatar`, `textarea`, `btn`, `dropdown-menu`, `badge`, `empty`, `field` |
| Route | inside a page (`#comments`) |
| Needs | Web: `GET /posts/{id}/comments`, `POST /posts/{id}/comments`, `PATCH /comments/{id}`, `DELETE /comments/{id}`. No server: `store.comments(postId)`, `store.addComment(c)`. Needs Log in and accounts to know who writes (no server: one local person). |
| Links to | Mentions, Reactions, Threads (chat-style replies), DeleteUndo, AppForum, AppCode, IssueDetail |

## Markup

```html
<section id="comments" class="grid gap-4" aria-labelledby="comments-title">
  <h2 id="comments-title" class="text-lg font-semibold"><span data-t="comments.title">Comments</span> <span class="text-muted-foreground">(3)</span></h2>

  <ol class="grid gap-4">
    <li id="comment-81">
      <article class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <span class="avatar" data-size="sm"><span>RS</span></span>
        <div class="grid gap-1">
          <header class="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span class="font-medium">Ren Sato</span>
            <a class="text-muted-foreground hover:underline" href="#comment-81"><time datetime="2026-10-18T09:12+09:00">2 h ago</time></a>
          </header>
          <p class="text-sm leading-relaxed">Could we add the reading in hiragana under each kanji?</p>
          <footer class="flex items-center gap-1">
            <button class="btn" data-variant="ghost" data-size="xs" type="button" aria-expanded="false" aria-controls="reply-81" data-t="comments.reply">Reply</button>
            <div class="dropdown-menu">
              <button class="btn" data-variant="ghost" data-size="icon-xs" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="More for Ren Sato’s comment">⋯</button>
              <div data-popover aria-hidden="true"><div role="menu">
                <button role="menuitem" data-t="comments.copy_link">Copy Link</button>
                <button role="menuitem" data-t="comments.report">Report…</button>
              </div></div>
            </div>
          </footer>
          <ol class="mt-2 grid gap-3 border-l pl-4" aria-label="Replies to Ren Sato">
            <li id="comment-82">
              <article class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <span class="avatar" data-size="sm"><span>AK</span></span>
                <div class="grid gap-1">
                  <header class="flex flex-wrap items-baseline gap-x-2 text-sm"><span class="font-medium">Aiko Kato</span><span class="badge" data-variant="secondary" data-t="comments.author">Author</span><a class="text-muted-foreground hover:underline" href="#comment-82"><time datetime="2026-10-18T09:40+09:00">1 h ago</time></a></header>
                  <p class="text-sm leading-relaxed">Good idea, added.</p>
                </div>
              </article>
            </li>
          </ol>
        </div>
      </article>
    </li>
  </ol>

  <form class="grid grid-cols-[auto_1fr] gap-3" hx-post="/posts/7/comments" hx-target="#comments" hx-select="#comments" hx-swap="outerHTML">
    <span class="avatar" data-size="sm"><span>AK</span></span>
    <div class="field">
      <label class="label sr-only" for="comment-new" data-t="comments.new_label">Write a comment</label>
      <textarea class="textarea min-h-20" id="comment-new" name="body" placeholder="Write a comment…" data-t-placeholder="comments.placeholder" maxlength="2000" required></textarea>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground text-xs" data-t="comments.hint">⌘Return to send</span>
        <button class="btn" data-size="sm" type="submit" data-t="comments.send">Comment</button>
      </div>
    </div>
  </form>
</section>
```

Replies are one level deep: a reply to a reply goes into the same list, starting with `@Name` (Mentions).

## States

| State | What changes |
| --- | --- |
| Thread (default) | Oldest first; replies under their comment. |
| No comments | `<p class="text-muted-foreground text-sm" data-t="comments.empty">No comments yet. Start the conversation.</p>` above the form. |
| Sending | The send button `disabled aria-busy="true"`, text `comments.sending`; the comment appears at once with `opacity-60` and `comments.sending` instead of the time. |
| Send failed | The pending comment shows `comments.failed` in `text-destructive` with **Retry** and **Delete**; the text is kept. |
| Replying | **Reply** sets `aria-expanded="true"` and shows a small form (same as the main one, `id="reply-81"`) under that comment, focused. |
| Your own comment | The ⋯ menu adds **Edit** and **Delete**; edited comments show `comments.edited` after the time. |
| Deleted | With replies: the text becomes `comments.deleted` in `text-muted-foreground italic`; without replies it disappears with an Undo toast. |
| Logged out | The form is replaced by `comments.login_to_comment` with a **Log In** link (LogIn). |
| Long thread | After 20 comments: `comments.show_more` loads older ones (button above the list). |
| New comment from someone else | With Presence: it appears at the end with a short `bg-muted` highlight; nothing jumps above the reader's position. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `comments.title` | Comments | コメント |
| `comments.reply` | Reply | 返信 |
| `comments.more` | More for {name}’s comment | {name} さんのコメントのメニュー |
| `comments.copy_link` | Copy Link | リンクをコピー |
| `comments.report` | Report… | 報告… |
| `comments.edit` | Edit | 編集 |
| `comments.delete` | Delete | 削除 |
| `comments.author` | Author | 投稿者 |
| `comments.replies_to` | Replies to {name} | {name} さんへの返信 |
| `comments.new_label` | Write a comment | コメントを書く |
| `comments.placeholder` | Write a comment… | コメントを書く… |
| `comments.hint` | ⌘Return to send | ⌘Return で送信 |
| `comments.send` | Comment | コメントする |
| `comments.sending` | Sending… | 送信中… |
| `comments.failed` | Not sent. | 送信できませんでした。 |
| `comments.retry` | Retry | 再試行 |
| `comments.edited` | (edited) | （編集済み） |
| `comments.deleted` | This comment was deleted. | このコメントは削除されました。 |
| `comments.empty` | No comments yet. Start the conversation. | まだコメントはありません。最初のコメントを書きましょう。 |
| `comments.login_to_comment` | Log in to comment. | コメントするにはログインしてください。 |
| `comments.show_more` | Show {count} earlier comments | 以前のコメントを {count} 件表示 |
| `comments.time.minutes` | {n} min ago | {n} 分前 |
| `comments.time.hours` | {n} h ago | {n} 時間前 |

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
