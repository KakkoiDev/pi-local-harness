# Profile

App Block card (Accounts). The person's public face in the app: a picture, a display name and a short bio, with the picture uploaded or removed.

- Basecoat: `card`, `avatar`, `field`, `label`, `input`, `textarea`, `btn`, `alert-dialog`
- Route: `/profile`
- Needs: Web: `GET/POST /profile`, `POST /profile/avatar`, `DELETE /profile/avatar`. No server: store `profile` (name, bio, avatar as a data URL ≤ 200 KB)
- Links to: AccountSettings (email and password live there), SavedState, FileUpload

## Markup
Copy, never retype: `{harness}/kit/blocks/accounts/Profile.html` (35 lines of HTML).

No picture: the avatar shows initials instead of `img`: `<span class="avatar size-20 text-xl"><span>AT</span></span>`, and Remove is hidden.

## States
- Loaded (default): As above; Save Profile is enabled but saves nothing when nothing changed.
- Picture chosen: The `img` shows the chosen file at once (`URL.createObjectURL`); `#profile-saved` reads `profile.unsaved`.
- Uploading: The avatar gets `aria-busy="true"` and `opacity-60`; the upload button is `disabled`.
- Picture too big / wrong type: Under the help line: `<p class="text-destructive text-sm" role="alert">` `profile.avatar.too_big` or `profile.avatar.wrong_type`; the old picture stays.
- Remove: An `alert-dialog` with `data-size="sm"`: `profile.avatar.remove_title` · Cancel · Remove Picture (`destructive`). After it, initials show.
- Name empty: `aria-invalid="true"` and `profile.error.name_empty`.
- Saving: Submit `disabled` + `aria-busy="true"`, `profile.saving`.
- Saved: `#profile-saved` reads `profile.saved` with the time (SavedState).
- Save failed: `#profile-saved` becomes `text-destructive`: `profile.save_failed`, with Try Again.

## Texts
(Key | English | 日本語)
- `profile.title`: Profile | プロフィール
- `profile.avatar.upload`: Upload a Picture | 画像をアップロード
- `profile.avatar.remove`: Remove | 削除
- `profile.avatar.help`: PNG, JPEG or WebP, up to 5 MB. It’s cropped to a square. | PNG・JPEG・WebP、5 MB まで。正方形に切り抜かれます。
- `profile.avatar.too_big`: That picture is over 5 MB. Choose a smaller one. | 画像が 5 MB を超えています。小さい画像を選んでください。
- `profile.avatar.wrong_type`: Use a PNG, JPEG or WebP picture. | PNG・JPEG・WebP の画像を使ってください。
- `profile.avatar.remove_title`: Remove your picture? | 画像を削除しますか？
- `profile.avatar.remove_body`: Your initials will show instead. | 代わりにイニシャルが表示されます。
- `profile.avatar.remove_confirm`: Remove Picture | 画像を削除
- `profile.name`: Display name | 表示名
- `profile.bio`: About you | 自己紹介
- `profile.save`: Save Profile | プロフィールを保存
- `profile.saving`: Saving… | 保存中…
- `profile.saved`: Saved at {time} | {time} に保存しました
- `profile.unsaved`: Not saved yet | まだ保存されていません
- `profile.save_failed`: Couldn’t save. Check your connection and try again. | 保存できませんでした。接続を確認して、もう一度お試しください。
- `profile.error.name_empty`: Enter a display name. | 表示名を入力してください。
- `common.try_again`: Try Again | もう一度試す

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Profile` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
