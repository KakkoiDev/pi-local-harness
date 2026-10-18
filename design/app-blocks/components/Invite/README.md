# Invite

A dialog to invite people to a project or workspace by email, choosing each one's role, plus a link that anyone can join with; the person invited gets an accept page.

| | |
| --- | --- |
| Group | Sharing and people |
| Basecoat | `dialog`, `field`, `label`, `input`, `select` (native), `btn`, `item`, `avatar`, `badge`, `alert`, `input-group` |
| Route | the dialog opens from a **Share** or **Invite People** button; the accept page is `/invites/{token}` |
| Needs | Web, needs a server: `POST /projects/{id}/invites` (emails, role), `DELETE /invites/{id}`, `POST /projects/{id}/invite-link` (create/reset), `GET /invites/{token}`, `POST /invites/{token}/accept`. Email sending (SMTP settings). Capability “Sharing and roles” (needs “Log in and accounts”). |
| Links to | Roles (what each role can do), TagInput (several emails), LogIn / SignUp (accepting), Toasts, ConfirmDialog (reset link), AvatarGroup |

## Markup

```html
<button class="btn" type="button" onclick="document.getElementById('invite-dialog').showModal()" data-t="invite.open">Invite People</button>

<dialog id="invite-dialog" class="dialog" aria-labelledby="invite-title" aria-describedby="invite-desc" onclick="if (event.target === this) this.close()">
  <div class="w-full @3xl:max-w-lg">
    <header>
      <h2 id="invite-title" data-t="invite.title">Invite people to Class project</h2>
      <p id="invite-desc" data-t="invite.lede">They get an email with a link. Invitations expire after 7 days.</p>
    </header>
    <section class="grid gap-4">
      <form id="invite-form" class="grid gap-2" hx-post="/projects/12/invites" hx-target="#invite-pending" hx-swap="beforeend">
        <label class="label" for="invite-emails" data-t="invite.emails">Email addresses</label>
        <div class="flex gap-2">
          <input class="input flex-1" id="invite-emails" name="emails" type="text" inputmode="email" autocomplete="off" placeholder="name@example.com, …" aria-describedby="invite-emails-hint" required>
          <label class="sr-only" for="invite-role" data-t="invite.role">Role</label>
          <select class="select w-32" id="invite-role" name="role">
            <option value="member" selected data-t="roles.member">Member</option>
            <option value="viewer" data-t="roles.viewer">Viewer</option>
            <option value="owner" data-t="roles.owner">Owner</option>
          </select>
        </div>
        <p class="text-muted-foreground text-sm" id="invite-emails-hint" data-t="invite.emails_hint">Separate several addresses with commas.</p>
        <button class="btn justify-self-end" type="submit" data-t="invite.send">Send Invitations</button>
      </form>

      <div class="grid gap-2">
        <h3 class="text-sm font-medium" data-t="invite.people">People with access</h3>
        <ul class="item-group" id="invite-pending">
          <li class="item" data-size="sm">
            <figure><span class="avatar" data-size="sm"><span>AK</span></span></figure>
            <section><h4>Aiko Kato <span class="text-muted-foreground font-normal" data-t="invite.you">(you)</span></h4><p>aiko@example.com</p></section>
            <aside><span class="text-muted-foreground text-sm" data-t="roles.owner">Owner</span></aside>
          </li>
          <li class="item" data-size="sm">
            <figure><span class="avatar" data-size="sm"><span>RS</span></span></figure>
            <section><h4>ren@example.com</h4><p><span class="badge" data-variant="outline" data-t="invite.pending">Invited</span> <span data-t="invite.expires">expires 25 Oct</span></p></section>
            <aside class="flex gap-1">
              <button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="invite.resend">Resend</button>
              <button class="btn" data-variant="ghost" data-size="sm" type="button" aria-label="Cancel invitation for ren@example.com" data-t="invite.cancel">Cancel</button>
            </aside>
          </li>
        </ul>
      </div>

      <div class="grid gap-2 border-t pt-4">
        <h3 class="text-sm font-medium" data-t="invite.link">Invite link</h3>
        <div class="flex gap-2">
          <label class="sr-only" for="invite-link" data-t="invite.link">Invite link</label>
          <input class="input flex-1 font-mono text-xs" id="invite-link" readonly value="https://notes.example.com/invites/k3p9-a72d">
          <button class="btn" data-variant="outline" type="button" data-t="invite.copy">Copy</button>
        </div>
        <p class="text-muted-foreground text-sm"><span data-t="invite.link_hint">Anyone with the link joins as a Viewer.</span> <button class="btn" data-variant="link" data-size="sm" type="button" data-t="invite.reset_link">Reset Link…</button></p>
      </div>
    </section>
    <footer>
      <button class="btn" data-variant="outline" type="button" onclick="this.closest('dialog').close()" data-t="invite.done">Done</button>
    </footer>
  </div>
</dialog>
```

The accept page (`/invites/{token}`) is a `card` like LogIn's: `invite.accept.title` (“Aiko invited you to Class project”), the role, **Accept Invitation** (default) and **Decline**; logged out, it shows LogIn / SignUp first and returns here.

## States

| State | What changes |
| --- | --- |
| Open (default) | Focus in the emails field; the list shows everyone with access and pending invitations. |
| Invalid email | `aria-invalid="true"` on the field and `invite.error.email` naming the bad address under it; nothing is sent. |
| Already in | `invite.error.already` for that address; others are sent. |
| Sending | **Send Invitations** `disabled aria-busy="true"`, text `invite.sending`. |
| Sent | New rows appear with **Invited**; the field empties; a toast `invite.sent` (“2 invitations sent.”). |
| Email couldn’t be sent | The row shows `invite.error.mail` in `text-destructive` with **Copy Link** for that person instead. |
| Copied | The Copy button reads `invite.copied` for 2 s (`aria-live="polite"` region announces it). |
| Reset link | ConfirmDialog: `invite.reset.title` / `invite.reset.body`; the old link stops working. |
| Not allowed | Members and viewers see the list read-only and `invite.only_owners`; no form. |
| Expired / used invite (accept page) | `invite.accept.expired` with **Ask for a New Invitation** (mailto to the inviter is not used; it notifies the owner). |
| Opening an invitation | The invitee’s page shows `invite.accept.title` (“Aiko Kato invited you to Class 3-B”) as its `h1`, then Accept Invitation and Decline. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `invite.open` | Invite People | メンバーを招待 |
| `invite.title` | Invite people to {project} | {project} にメンバーを招待 |
| `invite.lede` | They get an email with a link. Invitations expire after 7 days. | 招待された人にはリンク付きのメールが届きます。招待の有効期限は 7 日間です。 |
| `invite.emails` | Email addresses | メールアドレス |
| `invite.emails_hint` | Separate several addresses with commas. | 複数のアドレスはカンマで区切ってください。 |
| `invite.role` | Role | 役割 |
| `invite.send` | Send Invitations | 招待を送信 |
| `invite.sending` | Sending… | 送信中… |
| `invite.sent` | {count} invitations sent. | {count} 件の招待を送信しました。 |
| `invite.people` | People with access | アクセスできるメンバー |
| `invite.you` | (you) | （あなた） |
| `invite.pending` | Invited | 招待中 |
| `invite.expires` | expires {date} | 有効期限 {date} |
| `invite.resend` | Resend | 再送信 |
| `invite.cancel` | Cancel | 取り消す |
| `invite.link` | Invite link | 招待リンク |
| `invite.copy` | Copy | コピー |
| `invite.copied` | Copied | コピーしました |
| `invite.link_hint` | Anyone with the link joins as a Viewer. | リンクを知っている人は誰でも閲覧者として参加できます。 |
| `invite.reset_link` | Reset Link… | リンクを再発行… |
| `invite.reset.title` | Reset the invite link? | 招待リンクを再発行しますか？ |
| `invite.reset.body` | The current link stops working. People who already joined keep their access. | 現在のリンクは使えなくなります。すでに参加している人のアクセスはそのままです。 |
| `invite.done` | Done | 完了 |
| `invite.only_owners` | Only owners can invite people. | メンバーを招待できるのはオーナーだけです。 |
| `invite.error.email` | “{email}” isn’t an email address. | 「{email}」はメールアドレスではありません。 |
| `invite.error.already` | {email} already has access. | {email} はすでにアクセスできます。 |
| `invite.error.mail` | The email couldn’t be sent. Share the link instead. | メールを送信できませんでした。代わりにリンクを共有してください。 |
| `invite.accept.title` | {name} invited you to {project} | {name} さんが {project} に招待しています |
| `invite.accept.button` | Accept Invitation | 招待を受ける |
| `invite.accept.decline` | Decline | 辞退する |
| `invite.accept.expired` | This invitation has expired or was already used. | この招待は期限切れか、すでに使用されています。 |

Role names come from Roles (`roles.owner`, `roles.member`, `roles.viewer`).

## Keyboard and focus

1. Emails → 2. Role → 3. Send Invitations → 4. each row's Resend / Cancel → 5. Copy → 6. Reset Link… → 7. Done.
- Return in the emails field sends. Esc closes the dialog; focus returns to **Invite People**.
- After sending, focus returns to the emails field.

## Phone

- The dialog fills the width (`w-full`, Basecoat keeps 1 rem margins); the email field and role select stack (`flex-col` under `@max-3xl:`), Send Invitations is full width.
- The sheet scrolls inside; Done stays at the end.
- Where `navigator.share` exists, Copy becomes **Share Link** (`invite.share`: “Share Link” / “リンクを共有”).

## Data

```json
{"project": {"id": 12, "name": "Class project"},
 "members": [{"user_id": 3, "name": "Aiko Kato", "email": "aiko@example.com", "role": "owner", "you": true}],
 "invites": [{"id": 55, "email": "ren@example.com", "role": "member", "expires_at": "2026-10-25T09:00:00+09:00", "status": "pending"}],
 "link": {"url": "https://notes.example.com/invites/k3p9-a72d", "role": "viewer"}}
```

- `POST /projects/12/invites` with `emails=ren@example.com,mina@example.com&role=member` → 200 with the new rows; 422 `{"errors": [{"email": "mina@", "code": "invalid"}]}`; 403 when not an owner.
- Tokens are random (128 bits), single use for email invites, stored hashed.

## Don't

- Don't invite without a role; Member is the default.
- Don't reveal whether an email already has an account on the site.
- Don't put the link's role picker here unless asked; it is Viewer.
