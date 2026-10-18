# AppChat

A team chat: workspaces with channels and direct messages, threads under messages, reactions, mentions, presence and typing, searchable history.

| | |
| --- | --- |
| Group | Apps |
| Example product | Tsuru Chat (team chat) |
| Blocks | AccountSettings, ActivityFeed, AvatarGroup, Channels, CommandPalette, DataTable, EditForm, EmailConfirm, EmptyState, FileUpload, GlobalSearch, Invite, ListSearch, LogIn, Mentions, MessageComposer, Notifications, Onboarding, Presence, Profile, Reactions, Roles, SettingsPage, SidePanel, SignUp, Threads |
| Packages | Web app (full stack) with Multiplayer, real time. Messages are shared by everyone in the workspace, so there is no no-server version. |
| Related | AppNotes (links and mentions), AppForum (slower, public discussion) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Channel | `/w/{ws}/c/{channel}` | SidePanel, Channels, MessageComposer, Threads, Reactions, Mentions, Presence, FileUpload |
| Direct message | `/w/{ws}/dm/{user}` | Channels, MessageComposer, Presence, Threads |
| Thread | `(side panel on a channel)` | Threads, MessageComposer, Reactions, Mentions |
| Activity | `/w/{ws}/activity` | Notifications, ActivityFeed, EmptyState |
| Search | `/w/{ws}/search` | GlobalSearch, ListSearch, CommandPalette |
| New channel | `(dialog)` | EditForm, Invite, Roles |
| Workspace members | `/w/{ws}/members` | DataTable, Invite, Roles, AvatarGroup |
| Workspaces | `/` | ListSearch, Onboarding, EmptyState |
| Profile and settings | `/settings` | Profile, SettingsPage, AccountSettings |
| Sign in | `/login` | LogIn, SignUp, EmailConfirm |

## Navigation

- SidePanel: the workspace switcher at the top, then Activity, Search, the Channels list (unread in bold with a count badge), Direct messages (with Presence dots), and New Channel. The channel's header shows its name, topic, members (AvatarGroup) and a Threads/Details toggle.
- A thread opens in a right-hand panel on the desktop, as its own screen on the phone.
- CommandPalette (⌘K / Ctrl+K) jumps to any channel or person.
- Phone: BottomBar Home (channels and DMs) · Activity · Search · You.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Post and reply**

1. Channel: Channels, type in MessageComposer, Return sends (Shift+Return for a new line, ↑ edits your last message)
2. Channel: Reactions on a message; Mentions @Kenji in a reply
3. Thread: Threads panel; Kenji replies there; the channel shows "2 replies"

**Catch up**

1. Activity: Notifications lists mentions and thread replies since last visit
2. Thread: open one, reply, it is marked read

**Start a channel**

1. New channel: EditForm name and topic, public or private
2. New channel: Invite people; Roles for who can post

**Find an old message**

1. Search: GlobalSearch "timetable" with filters in: from: before:
2. Channel: jumps to the message, highlighted

## Phone

- Home lists channels and DMs; a channel is its own screen with Back; the composer sits at the bottom of the column (not fixed) and grows to 5 lines.
- Long-press a message opens a sheet: React, Reply in Thread, Copy Text, Edit, Delete; the same actions are in a ⋯ button on each message for keyboard and mouse.

## Data model

| Table | Fields |
| --- | --- |
| `workspaces` | id, name, slug, created_by |
| `members` | workspace_id, user_id, role (owner · admin · member · guest), joined_at |
| `channels` | id, workspace_id, name, topic, private, archived |
| `channel_members` | channel_id, user_id, last_read_message_id, muted |
| `messages` | id, channel_id, thread_root_id, author_id, body (Markdown), edited_at, deleted_at, created_at |
| `reactions` | message_id, user_id, emoji |
| `attachments` | id, message_id, path, name, size, mime |

Live updates go over a WebSocket (htmx `hx-ws`): new message, edit, delete, reaction, typing, presence. Unread = messages after `last_read_message_id`.

## Capabilities and packages

Capabilities: **Log in and accounts**, **Sharing and roles**, **Database**, **Multiplayer, real time**, **File uploads**, **Installs on a phone** (with notifications). Package: **Web app (full stack)**.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Tsuru Chat | つるチャット |
| `nav.home` | Home | ホーム |
| `nav.activity` | Activity | アクティビティ |
| `nav.search` | Search | 検索 |
| `nav.you` | You | あなた |
| `nav.channels` | Channels | チャンネル |
| `nav.dms` | Direct messages | ダイレクトメッセージ |
| `nav.new_channel` | New Channel | 新しいチャンネル |

## Adding to it

- Calls, huddles and screen sharing are not covered by any block and need WebRTC, which the kit doesn't carry; leave them out.
- Every place that sends a message (channel, DM, thread) uses **MessageComposer**: Markdown shortcuts, attachments, Mentions, emoji, Return to send, ↑ to edit the last message.
