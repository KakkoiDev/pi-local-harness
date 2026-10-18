# DeleteAccount

Delete the account for good: say plainly what happens to the data, offer a copy first, confirm with the password, and allow cancelling for 30 days.

| | |
| --- | --- |
| Group | Accounts |
| Basecoat | `card`, `alert`, `field`, `label`, `input`, `btn` |
| Route | `/settings/account/delete`; after deleting, `/goodbye` |
| Needs | Web: `GET /account/export`, `POST /account/delete`, `POST /account/delete/cancel`. Needs a server |
| Links to | AccountSettings (comes from), LogIn |

## Markup

```html
<main class="app mx-auto grid w-full max-w-xl gap-6 p-4 @3xl:p-8">
  <a class="btn w-fit" data-variant="ghost" href="/settings/account" data-t="delete.back">Back to Account</a>
  <form id="delete-form" class="card" method="post" action="/account/delete" novalidate>
    <header>
      <h1 class="text-xl font-semibold" data-t="delete.title">Delete your account?</h1>
      <p class="text-muted-foreground text-sm" data-t="delete.lede">Here is what happens. Read it before you decide.</p>
    </header>
    <section class="grid gap-4">
      <ul class="grid gap-2 text-sm list-disc pl-5">
        <li data-t="delete.what.now">You’re logged out everywhere now, and nobody can see your profile.</li>
        <li data-t="delete.what.wait">For 30 days, until 17 November 2026, you can log in and cancel. Nothing is lost yet.</li>
        <li data-t="delete.what.after">After that, your notes, pictures and comments are deleted for good. They can’t be brought back.</li>
        <li data-t="delete.what.shared">Pages you shared with others are deleted too. Copies they made stay theirs.</li>
        <li data-t="delete.what.kept">We keep invoices for 7 years because the law requires it. Nothing else.</li>
      </ul>
      <div class="alert">
        <h2 data-t="delete.export.title">Want a copy first?</h2>
        <section data-t="delete.export.body">Download everything as a ZIP of JSON and your original files.
          <div class="mt-2"><a class="btn" data-variant="outline" data-size="sm" href="/account/export" data-t="delete.export.action">Download My Data</a></div>
</section>
      </div>
      <div class="field">
        <label class="label" for="delete-password" data-t="delete.password">Enter your password to confirm</label>
        <input class="input" id="delete-password" name="password" type="password" autocomplete="current-password" required>
      </div>
    </section>
    <footer class="flex flex-wrap justify-end gap-2">
      <a class="btn" data-variant="outline" href="/settings/account" data-t="common.cancel">Cancel</a>
      <button class="btn" data-variant="destructive" type="submit" data-t="delete.submit">Delete My Account</button>
    </footer>
  </form>
</main>
```

Logging in during the 30 days shows, instead of the app:

```html
<section class="card w-full max-w-sm" aria-labelledby="pending-title">
  <header>
    <h1 id="pending-title" class="text-xl font-semibold" data-t="delete.pending.title">Your account will be deleted on 17 November 2026</h1>
    <p class="text-muted-foreground text-sm" data-t="delete.pending.body">Cancel now to keep everything as it was.</p>
  </header>
  <footer class="grid gap-2">
    <form method="post" action="/account/delete/cancel" class="contents"><button class="btn w-full" type="submit" data-t="delete.pending.cancel">Keep My Account</button></form>
    <form method="post" action="/logout" class="contents"><button class="btn w-full" data-variant="ghost" type="submit" data-t="logout.action">Log Out</button></form>
  </footer>
</section>
```

## States

| State | What changes |
| --- | --- |
| Default | As above; Delete My Account is enabled; the password field is empty. |
| Password empty or wrong | `aria-invalid="true"` + `delete.error.password` under the field; nothing happens. |
| Deleting | Submit `disabled` + `aria-busy="true"`, `delete.deleting`. |
| Done | Logged out, redirect to `/goodbye`: a card with `delete.done.title` / `delete.done.body` (with the date) and Log In to Cancel. |
| Pending (logged in again) | The pending card replaces the app until cancelled or logged out. |
| Cancelled | Back to the app; a toast `delete.cancelled`. |
| Owner of a shared space | Before the form, `alert` `data-variant="destructive"` titled `delete.owner_title` with `delete.owner` and a link to Roles; the submit is `disabled` until ownership is passed on. |
| Export preparing | The download button `aria-busy="true"`, `delete.export.preparing`; the file downloads when ready (up to a minute). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `delete.back` | Back to Account | アカウントに戻る |
| `delete.title` | Delete your account? | アカウントを削除しますか？ |
| `delete.lede` | Here is what happens. Read it before you decide. | 削除すると次のようになります。決める前にお読みください。 |
| `delete.what.now` | You’re logged out everywhere now, and nobody can see your profile. | すぐにすべてのデバイスからログアウトされ、プロフィールは誰からも見えなくなります。 |
| `delete.what.wait` | For 30 days, until {date}, you can log in and cancel. Nothing is lost yet. | {date} までの30日間はログインしてキャンセルできます。この間はデータは失われません。 |
| `delete.what.after` | After that, your notes, pictures and comments are deleted for good. They can’t be brought back. | その後、ノート・画像・コメントは完全に削除され、元に戻せません。 |
| `delete.what.shared` | Pages you shared with others are deleted too. Copies they made stay theirs. | 共有したページも削除されます。相手が作成したコピーは残ります。 |
| `delete.what.kept` | We keep invoices for 7 years because the law requires it. Nothing else. | 法律により請求書のみ7年間保管します。それ以外は保管しません。 |
| `delete.export.title` | Want a copy first? | 先にコピーを保存しますか？ |
| `delete.export.body` | Download everything as a ZIP of JSON and your original files. | すべてのデータを JSON と元のファイルの ZIP でダウンロードできます。 |
| `delete.export.action` | Download My Data | データをダウンロード |
| `delete.export.preparing` | Preparing… | 準備中… |
| `delete.password` | Enter your password to confirm | 確認のためパスワードを入力してください |
| `delete.submit` | Delete My Account | アカウントを削除 |
| `delete.deleting` | Deleting… | 削除中… |
| `delete.error.password` | Enter your current password. | 現在のパスワードを入力してください。 |
| `delete.done.title` | Your account is scheduled for deletion | アカウントの削除を予約しました |
| `delete.done.body` | It will be deleted on {date}. Log in before then to cancel. | {date} に削除されます。それまでにログインするとキャンセルできます。 |
| `delete.done.login` | Log In to Cancel | ログインしてキャンセル |
| `delete.pending.title` | Your account will be deleted on {date} | アカウントは {date} に削除されます |
| `delete.pending.body` | Cancel now to keep everything as it was. | 今キャンセルすると、すべてそのまま残ります。 |
| `delete.pending.cancel` | Keep My Account | アカウントを残す |
| `delete.cancelled` | Your account is kept. Welcome back. | アカウントを残しました。おかえりなさい。 |
| `delete.owner_title` | Pass on ownership first | 先にオーナーを引き継いでください |
| `delete.owner` | You own “{space}”. Make someone else its owner before deleting your account. | 「{space}」のオーナーです。アカウントを削除する前に、別のメンバーをオーナーにしてください。 |
| `common.cancel` | Cancel | キャンセル |
| `logout.action` | Log Out | ログアウト |

## Keyboard and focus

1. Back to Account → 2. Download My Data → 3. Password → 4. Cancel → 5. Delete My Account.
- Focus starts on the heading so the list is read first. Return in the password field submits.
- Cancel is before Delete in the Tab order; neither is the default on Return outside the field.

## Phone

- One column; the two footer buttons wrap to full width (Delete under Cancel). 44 px targets.
- Download My Data saves a file through the browser's download; on iPhone it opens the Files sheet.

## Data

```json
{"request": {"password": "••••••••••"},
 "ok": {"delete_on": "2026-11-17", "redirect": "/goodbye"},
 "error": {"code": "wrong_password | owner_of_space", "spaces": ["Class 3B"]}}
```

- Web: `POST /account/delete` checks the password, marks the account `delete_on = today + 30 days`, ends all sessions, emails a confirmation with a cancel link; a daily job deletes accounts past their date (files, rows, search index, backups rotate out within 35 days). `GET /account/export` streams a ZIP.

## Don't

- Don't make the person type "DELETE"; the password is the confirmation.
- Don't hide the 30-day window or the kept invoices.
- Don't delete on a single click from AccountSettings.
