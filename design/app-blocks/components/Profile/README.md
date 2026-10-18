# Profile

The person's public face in the app: a picture, a display name and a short bio, with the picture uploaded or removed.

| | |
| --- | --- |
| Group | Accounts |
| Basecoat | `card`, `avatar`, `field`, `label`, `input`, `textarea`, `btn`, `alert-dialog` |
| Route | `/profile` |
| Needs | Web: `GET/POST /profile`, `POST /profile/avatar`, `DELETE /profile/avatar`. No server: store `profile` (name, bio, avatar as a data URL ≤ 200 KB) |
| Links to | AccountSettings (email and password live there), SavedState, FileUpload |

## Markup

```html
<main class="app mx-auto grid w-full max-w-2xl gap-6 p-4 @3xl:p-8">
  <h1 class="text-2xl font-semibold" data-t="profile.title">Profile</h1>
  <form id="profile-form" class="card" method="post" action="/profile" novalidate>
    <section class="grid gap-6">
      <div class="flex flex-wrap items-center gap-4">
        <span class="avatar size-20 text-xl" id="profile-avatar">
          <img src="/media/avatars/aiko.webp" alt="" width="80" height="80">
        </span>
        <div class="grid gap-2">
          <div class="flex flex-wrap gap-2">
            <label class="btn" data-variant="outline" for="profile-avatar-file">
              <span data-t="profile.avatar.upload">Upload a Picture</span>
            </label>
            <input id="profile-avatar-file" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" aria-describedby="profile-avatar-help">
            <button class="btn" data-variant="ghost" type="button" id="profile-avatar-remove" data-t="profile.avatar.remove">Remove</button>
          </div>
          <p class="text-muted-foreground text-sm" id="profile-avatar-help" data-t="profile.avatar.help">PNG, JPEG or WebP, up to 5 MB. It’s cropped to a square.</p>
        </div>
      </div>
      <div class="field">
        <label class="label" for="profile-name" data-t="profile.name">Display name</label>
        <input class="input" id="profile-name" name="name" type="text" autocomplete="nickname" maxlength="40" required value="Aiko Tanaka">
      </div>
      <div class="field">
        <label class="label" for="profile-bio" data-t="profile.bio">About you</label>
        <textarea class="textarea" id="profile-bio" name="bio" rows="3" maxlength="200" aria-describedby="profile-bio-count">Learning Japanese with my class on Tuesdays.</textarea>
        <p class="text-muted-foreground text-sm text-right" id="profile-bio-count" aria-live="polite">43 / 200</p>
      </div>
    </section>
    <footer class="flex items-center justify-end gap-3">
      <span id="profile-saved" class="text-muted-foreground text-sm" role="status"></span>
      <button class="btn" type="submit" data-t="profile.save">Save Profile</button>
    </footer>
  </form>
</main>
```

No picture: the avatar shows initials instead of `img`: `<span class="avatar size-20 text-xl"><span>AT</span></span>`, and Remove is hidden.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | As above; Save Profile is enabled but saves nothing when nothing changed. |
| Picture chosen | The `img` shows the chosen file at once (`URL.createObjectURL`); `#profile-saved` reads `profile.unsaved`. |
| Uploading | The avatar gets `aria-busy="true"` and `opacity-60`; the upload button is `disabled`. |
| Picture too big / wrong type | Under the help line: `<p class="text-destructive text-sm" role="alert">` `profile.avatar.too_big` or `profile.avatar.wrong_type`; the old picture stays. |
| Remove | An `alert-dialog` with `data-size="sm"`: `profile.avatar.remove_title` · Cancel · Remove Picture (`destructive`). After it, initials show. |
| Name empty | `aria-invalid="true"` and `profile.error.name_empty`. |
| Saving | Submit `disabled` + `aria-busy="true"`, `profile.saving`. |
| Saved | `#profile-saved` reads `profile.saved` with the time (SavedState). |
| Save failed | `#profile-saved` becomes `text-destructive`: `profile.save_failed`, with Try Again. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `profile.title` | Profile | プロフィール |
| `profile.avatar.upload` | Upload a Picture | 画像をアップロード |
| `profile.avatar.remove` | Remove | 削除 |
| `profile.avatar.help` | PNG, JPEG or WebP, up to 5 MB. It’s cropped to a square. | PNG・JPEG・WebP、5 MB まで。正方形に切り抜かれます。 |
| `profile.avatar.too_big` | That picture is over 5 MB. Choose a smaller one. | 画像が 5 MB を超えています。小さい画像を選んでください。 |
| `profile.avatar.wrong_type` | Use a PNG, JPEG or WebP picture. | PNG・JPEG・WebP の画像を使ってください。 |
| `profile.avatar.remove_title` | Remove your picture? | 画像を削除しますか？ |
| `profile.avatar.remove_body` | Your initials will show instead. | 代わりにイニシャルが表示されます。 |
| `profile.avatar.remove_confirm` | Remove Picture | 画像を削除 |
| `profile.name` | Display name | 表示名 |
| `profile.bio` | About you | 自己紹介 |
| `profile.save` | Save Profile | プロフィールを保存 |
| `profile.saving` | Saving… | 保存中… |
| `profile.saved` | Saved at {time} | {time} に保存しました |
| `profile.unsaved` | Not saved yet | まだ保存されていません |
| `profile.save_failed` | Couldn’t save. Check your connection and try again. | 保存できませんでした。接続を確認して、もう一度お試しください。 |
| `profile.error.name_empty` | Enter a display name. | 表示名を入力してください。 |
| `common.try_again` | Try Again | もう一度試す |

## Keyboard and focus

1. Upload a Picture (Return or Space opens the file chooser) → 2. Remove → 3. Display name → 4. About you → 5. Save Profile.
- ⌘S / Ctrl+S saves while focus is in the form.
- After Remove's dialog closes, focus returns to Upload a Picture.

## Phone

- One column; the avatar row wraps so the buttons sit under the picture. Buttons are 44 px.
- Upload a Picture opens the phone's photo picker and camera (`accept` lists images; don't add `capture`, which forces the camera).
- The Save button stays at the end of the form, not fixed.

## Data

```json
{"name": "Aiko Tanaka", "bio": "Learning Japanese with my class on Tuesdays.", "avatar_url": "/media/avatars/aiko.webp", "updated_at": "2026-10-18T14:32:00+09:00"}
```

- Web: `POST /profile` (form fields) → fragment with the saved state; `POST /profile/avatar` (multipart, 5 MB max) → the server resizes to 256 × 256 WebP and returns the new `avatar_url`; `DELETE /profile/avatar` → 204.
- No server: `store.saveProfile({name, bio, avatar})`; the picture is resized in a canvas to 256 px before saving.

## Don't

- Don't put the email or password on this page (AccountSettings).
- Don't upload on file choice without showing it first; the person saves.
- Don't use the alt text "avatar": a decorative picture next to the name has `alt=""`.
