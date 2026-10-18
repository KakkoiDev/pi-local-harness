# Roles

The members page of a project or workspace: each person with their role (Owner, Member, Viewer), a way for owners to change a role or remove someone, and a table of what each role can do.

| | |
| --- | --- |
| Group | Sharing and people |
| Basecoat | `table`, `select` (native), `avatar`, `badge`, `btn`, `alert-dialog`, `accordion` |
| Route | `/projects/{id}/members` (often a tab of Settings) |
| Needs | Web, needs a server: `GET /projects/{id}/members`, `PATCH /projects/{id}/members/{user_id}` (`role`), `DELETE /projects/{id}/members/{user_id}`. Every request is checked on the server against the role table below. Capability “Sharing and roles”. |
| Links to | Invite, ConfirmDialog, DataTable, SettingsPage, AvatarGroup, AppAdmin |

## The three roles (the same everywhere)

| Can… | Owner | Member | Viewer |
| --- | --- | --- | --- |
| See everything in the project | ✓ | ✓ | ✓ |
| Comment | ✓ | ✓ | ✓ |
| Add, edit and delete content | ✓ | ✓ | — |
| Invite people | ✓ | — | — |
| Change roles and remove people | ✓ | — | — |
| Rename, delete or transfer the project | ✓ | — | — |

A project always has at least one Owner. Anyone can leave a project, except its last Owner.

## Markup

```html
<section class="app grid gap-4 p-4 @3xl:p-8" aria-labelledby="members-title">
  <header class="flex flex-wrap items-center justify-between gap-2">
    <h1 id="members-title" class="text-xl font-semibold @3xl:text-2xl" data-t="roles.title">Members</h1>
    <button class="btn" type="button" data-t="invite.open">Invite People</button>
  </header>
  <div class="table-container">
    <table class="table">
      <thead>
        <tr><th scope="col" data-t="roles.col.person">Person</th><th scope="col" data-t="roles.col.role">Role</th><th scope="col" class="@max-3xl:hidden" data-t="roles.col.joined">Joined</th><th scope="col"><span class="sr-only" data-t="roles.col.actions">Actions</span></th></tr>
      </thead>
      <tbody>
        <tr>
          <td><div class="flex items-center gap-3"><span class="avatar"><span>AK</span></span><div><p class="font-medium">Aiko Kato <span class="text-muted-foreground font-normal" data-t="invite.you">(you)</span></p><p class="text-muted-foreground text-sm">aiko@example.com</p></div></div></td>
          <td>
            <label class="sr-only" for="role-3" data-t="roles.role_for">Role for Aiko Kato</label>
            <select class="select w-32" id="role-3" name="role" hx-patch="/projects/12/members/3" hx-trigger="change" hx-target="closest tr" hx-swap="outerHTML">
              <option value="owner" selected data-t="roles.owner">Owner</option>
              <option value="member" data-t="roles.member">Member</option>
              <option value="viewer" data-t="roles.viewer">Viewer</option>
            </select>
          </td>
          <td class="text-muted-foreground @max-3xl:hidden">2 Sep 2026</td>
          <td class="text-right"><button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="roles.leave">Leave</button></td>
        </tr>
        <tr>
          <td><div class="flex items-center gap-3"><span class="avatar"><span>MT</span></span><div><p class="font-medium">Mina Takahashi</p><p class="text-muted-foreground text-sm">mina@example.com</p></div></div></td>
          <td><!-- same select, "viewer" selected --></td>
          <td class="text-muted-foreground @max-3xl:hidden">14 Oct 2026</td>
          <td class="text-right"><button class="btn" data-variant="ghost" data-size="sm" type="button" aria-label="Remove Mina Takahashi" data-t="roles.remove">Remove</button></td>
        </tr>
      </tbody>
    </table>
  </div>
  <section class="accordion">
    <details>
      <summary data-t="roles.what_can">What can each role do?</summary>
      <!-- the role table above as <table class="table"> with roles.can.* rows -->
    </details>
  </section>
</section>
```

People who are not Owners see the role as text (`<span class="badge" data-variant="secondary">Member</span>`) instead of the select, and only **Leave** on their own row.

## States

| State | What changes |
| --- | --- |
| Owner viewing (default) | Selects and Remove on every row; their own row has **Leave**. |
| Member or Viewer viewing | Roles as badges; no Invite People; only their own **Leave**. |
| Changing a role | The row's select is `disabled` while saving; after: toast `roles.changed` (“Mina is now a Member.”). Downgrading yourself from Owner asks first (ConfirmDialog `roles.confirm_self`). |
| Last owner | Their select has the other options `disabled` and a hint under it: `roles.last_owner`. Their Leave is disabled with the same hint. |
| Remove | `alert-dialog`: `roles.remove.title` / `roles.remove.body`, **Cancel** · **Remove** (`data-variant="destructive"`). The row disappears; their content stays and keeps their name. |
| Save failed | The select goes back to the old role; toast `roles.error` with Try Again. |
| Pending invitations | Shown as rows with the badge **Invited** (see Invite) under the members. |
| Only you | The table has one row and a line `roles.alone` with **Invite People**. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `roles.title` | Members | メンバー |
| `roles.owner` | Owner | オーナー |
| `roles.member` | Member | メンバー |
| `roles.viewer` | Viewer | 閲覧者 |
| `roles.col.person` | Person | メンバー |
| `roles.col.role` | Role | 役割 |
| `roles.col.joined` | Joined | 参加日 |
| `roles.col.actions` | Actions | 操作 |
| `roles.role_for` | Role for {name} | {name} さんの役割 |
| `roles.remove` | Remove | 外す |
| `roles.leave` | Leave | 退出する |
| `roles.changed` | {name} is now a {role}. | {name} さんの役割を「{role}」に変更しました。 |
| `roles.confirm_self` | Stop being an Owner? You won’t be able to change roles or invite people. | オーナーをやめますか？役割の変更や招待ができなくなります。 |
| `roles.last_owner` | A project needs at least one Owner. Make someone else Owner first. | プロジェクトには少なくとも 1 人のオーナーが必要です。先に他の人をオーナーにしてください。 |
| `roles.remove.title` | Remove {name} from {project}? | {name} さんを {project} から外しますか？ |
| `roles.remove.body` | They lose access at once. What they wrote stays. | すぐにアクセスできなくなります。書いた内容は残ります。 |
| `roles.error` | The role couldn’t be changed. Try again. | 役割を変更できませんでした。もう一度お試しください。 |
| `roles.alone` | You’re the only member. | メンバーはあなただけです。 |
| `roles.what_can` | What can each role do? | 各役割でできること |
| `roles.can.see` | See everything in the project | プロジェクト内のすべてを見る |
| `roles.can.comment` | Comment | コメントする |
| `roles.can.edit` | Add, edit and delete content | 内容の追加・編集・削除 |
| `roles.can.invite` | Invite people | メンバーを招待する |
| `roles.can.manage` | Change roles and remove people | 役割の変更とメンバーの削除 |
| `roles.can.project` | Rename, delete or transfer the project | プロジェクトの名前変更・削除・移管 |

## Keyboard and focus

1. Invite People → 2. per row: role select → Remove/Leave → 3. What can each role do?
- Changing the select saves at once (no Save button); Esc in the select keeps the old value.
- After removing someone, focus moves to the next row's select (or the previous row's if it was the last).

## Phone

- The Joined column is hidden; the person cell keeps name and email on two lines.
- The role select is full height (44 px); Remove becomes an icon button with its `aria-label` if space is short (`data-size="icon"`, an × icon).

## Data

```json
{"project": {"id": 12, "name": "Class project"}, "you": {"user_id": 3, "role": "owner"},
 "members": [{"user_id": 3, "name": "Aiko Kato", "email": "aiko@example.com", "role": "owner", "joined_at": "2026-09-02"},
             {"user_id": 8, "name": "Mina Takahashi", "email": "mina@example.com", "role": "viewer", "joined_at": "2026-10-14"}]}
```

- `PATCH /projects/12/members/8` with `role=member` → 200 with the row; 403 if you're not an Owner; 409 `last_owner`.
- The server checks the role on every write (not only in the page); `can(user, action, project)` uses the table above as data, e.g. `{"owner": ["see","comment","edit","invite","manage","project"], "member": ["see","comment","edit"], "viewer": ["see","comment"]}`.

## Don't

- Don't add custom roles or per-page permissions here.
- Don't hide content from Viewers in the page only; refuse on the server.
- Don't let the last Owner leave or be downgraded.
