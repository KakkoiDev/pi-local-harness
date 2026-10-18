# AvatarGroup

A person's picture or initials, alone or as an overlapping group with a “+N” count, for owners, members and who is here.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `avatar` (`data-size="sm|lg"`, `.avatar-badge`), `avatar-group` (`[data-count]`), `tooltip` (`data-tooltip`) |
| Needs | Each person's name, and a picture URL if they set one |
| Used in | Profile, Presence, Comments, Threads, LabelsAssignees, IssueList, Roles, ActivityFeed, Kanban (assignee) |

## Markup

```html
<!-- One person: picture, with the name for screen readers -->
<span class="avatar" data-size="lg">
  <img src="/avatars/u1.webp" alt="Aiko Tanaka" width="40" height="40" loading="lazy">
</span>

<!-- No picture: initials on muted, the name in aria-label -->
<span class="avatar" role="img" aria-label="Kenji Sato"><span>KS</span></span>

<!-- With a status dot (online) -->
<span class="avatar" role="img" aria-label="Mei Wong, online" data-t-label="people.online_label">
  <span>MW</span><span class="avatar-badge bg-green-600"></span>
</span>

<!-- A group: at most 4 faces, then the count -->
<div class="avatar-group" role="group" aria-label="5 members" data-t-label="people.members">
  <span class="avatar" data-tooltip="Aiko Tanaka"><img src="/avatars/u1.webp" alt="Aiko Tanaka"></span>
  <span class="avatar" role="img" aria-label="Kenji Sato" data-tooltip="Kenji Sato"><span>KS</span></span>
  <span class="avatar" role="img" aria-label="Mei Wong" data-tooltip="Mei Wong"><span>MW</span></span>
  <span data-count aria-label="and 2 more" data-t-label="people.more">+2</span>
</div>

<!-- A group that opens the full list: the whole group is one button -->
<button type="button" class="avatar-group rounded-full" aria-haspopup="dialog" aria-controls="members-dialog" data-t-label="people.show_all">…same children…</button>
```

**Sizes**: `sm` 24 px (lists, comments), default 32 px (rows, cards), `lg` 40 px (profile headers). Larger (Profile page, 96 px) uses `class="avatar size-24 text-2xl"`.

**Initials**: first letter of the given and family name in Latin names (“Aiko Tanaka” → AT); for Japanese names, the first character of the family name only (田中 愛子 → 田), since two kanji are hard to read at 32 px. Names with neither: the first character.

**Colour**: initials stay on `bg-muted`; never a random colour per person (it carries no meaning and fails contrast in one theme).

## States

| State | What changes |
| --- | --- |
| Picture | `img` with `alt` = the name; if the image fails to load (`onerror`), swap to the initials `span`. |
| No picture | Initials. |
| Online / away / busy | `.avatar-badge` with `bg-green-600` / `bg-amber-500` / `bg-destructive`; the state goes into `aria-label` (“Mei Wong, online”). Don't rely on the colour alone in lists: the Presence card adds the word. |
| Many people | Group shows 4 faces + `+N`; N over 99 shows `99+`. With `sm` faces the count circle is 24 px: show at most `+9`, then `9+`. |
| Nobody | No group; text `people.none` (“No members yet”). |
| Removed account | Initials `?` and the name `people.removed` (“Deleted account”), muted. |
| Loading | `skeleton size-8 rounded-full bg-muted` per face. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `people.members` | {count} members | メンバー{count}人 |
| `people.more` | and {count} more | ほか{count}人 |
| `people.show_all` | Show all members | すべてのメンバーを表示 |
| `people.online_label` | {name}, online | {name}、オンライン |
| `people.away_label` | {name}, away | {name}、離席中 |
| `people.busy_label` | {name}, busy | {name}、取り込み中 |
| `people.none` | No members yet | メンバーはまだいません |
| `people.removed` | Deleted account | 削除されたアカウント |

## Keyboard and focus

- A single avatar is not focusable unless it is a link to the profile (`a.avatar href="/people/u1"`).
- A group that opens the member list is one button: one Tab stop, Return opens the dialog (focus to its first row), Esc returns to the button.
- Tooltips (`data-tooltip`) appear on hover and focus only; the name is always also in `alt`/`aria-label`.

## Phone

- Same sizes; a group used as a button gets `@max-3xl:min-h-11` padding so the tap area is 44 px even with 24 px faces.
- No hover on phones: the group opens the list instead of showing tooltips.

## Data

```json
{"members": [{"id": "u1", "name": "Aiko Tanaka", "avatar": "/avatars/u1.webp", "status": "online"},
             {"id": "u2", "name": "Kenji Sato", "avatar": null, "status": "away"}],
 "total": 5}
```

- Web: pictures are files served from `/avatars/<id>.webp` (see Profile for upload); render initials server-side.
- No server: pictures stored as small data URLs (≤64 KB, 256 px) in the store.

## Don't

- Don't load avatars from Gravatar or any other site.
- Don't show more than 4 faces in a group.
- Don't put the name only in `title`.
