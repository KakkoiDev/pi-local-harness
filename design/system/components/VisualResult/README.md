# VisualResult

An image or icon Pi chose or generated, shown inside Pi's message so the person can look at it closely before anything uses it (round 15 D, plan 266 visual follow-up). Boards: canvas page **Round 15**, R15_VisualResult, R15_VisualInspect, R15_VisualVariants, R15_VisualUse, R15_VisualStates, R15_Visual1024, R15_VisualWalk, Ph15_VisualResult, Ph15_VisualInspect, Ph15_VisualVariants. CSS: `scripts/round15_d.css` (`.pw-visual`, `.pw-thumb`, `.pw-backdrop`, `.pw-cands`, `.pw-cand`, `.pw-inspect`, `.pw-revs`, `.pw-inert`).

The chrome is 1-bit. Only the asset and its backdrop carry colour.

## Anatomy

- `section.pw-visual[aria-label="Icon · save"]`, in `article.pw-msg` after Pi's words, where the music player sits for sound.
- **Head** `.pw-visual__head`: picture glyph, `h3.pw-visual__title` “<Kind> · <name>”, and the status tag on the right.
- **Body** `.pw-visual__body`: the thumbnail, a `dl.pw-facts`, and `.pw-visual__alt`.
  - The thumbnail is `button.pw-thumb.pw-backdrop[data-bg="checker"]`, 64 px. Its accessible name is “Inspect <name> icon, revision <n>”, and it opens the inspector.
  - The facts: Name, Source (“Generated · Meadow palette · recipe save.json” or “Chosen · visual-core icon set · MIT”), File (type · w × h px · transparent · size) and Revision (“2 of 2 · assets/icons/save/2/”).
  - The description is labelled “what a screen reader hears”. It is the image's `alt` everywhere.
- **Foot** `.pw-visual__foot`: a `.pw-help` line saying where the asset stands, then the actions, default first.

## Status: three, never mixed up

| Tag | Means | Default action | What the action does |
| --- | --- | --- | --- |
| `Proposal` (dotted) | Picked from a library; not in the project | **Copy to Project** | Saves it as revision 1 of `assets/<kind>/<name>/`. The app is not touched. |
| `Generated · not used` | A numbered file in the project; no app file refers to it | **Use This Icon…** | Opens a confirmation naming the one app file it changes, then changes it as one request with Undo This Request…. The icon file is not changed. |
| `In use` | An app file refers to it; the help line names that file | Inspect | Nothing changes. A newer revision never replaces it by itself. |

Viewing, inspecting, switching backdrop or zoom, or choosing a candidate never approves a plan, never changes the phase, and never writes or replaces a file.

## Revisions

`assets/<kind>/<name>/<n>/<file>`, numbered from 1 and never overwritten. Ask for Another adds revision n+1. Generating and saving these files is the constitution's narrow media exception, allowed in every phase. Using an asset changes an app file, so it follows the phase and Gate:

- **Discussion or Planning:** Use This Icon… is visible, disabled, and described by “Using it changes app/index.html, and the project is in Discussion. Plan it, or choose Implementation (⌃⌥I).” plus **Change Phase…**.
- **Implementation, file outside the task's Files:** Gate's scope card (“Pi wants to change a file outside task 2”).

## Candidates

`fieldset.pw-cands[role=radiogroup]` with the legend “Choose one to look at closely or use. All four are saved.” Each `label.pw-cand` holds a radio whose name is “Candidate 2: Blue notebook with a yellow bookmark”, a 48 px thumbnail (64 px on the phone) and its number. Choosing sets which candidate Inspect and Use act on; it writes nothing. The candidates are saved as revisions 1–n.

## Inspector

A dialog on the desk (`role=dialog`, “Icon save, revision 2”, 760 px) and full screen on the phone.

- **Stage:** `.pw-inspect__view.pw-backdrop` with pixels kept sharp (`image-rendering: pixelated`).
  - Backdrop radios: Checker (default for transparent files), Light, Dark.
  - Zoom radios: 1×, 4×, 8×, Fit. The default is the largest that fits.
- **Side:**
  - About this file: Source, File, Revision, and Used in (“nothing yet” or the file).
  - The description.
  - Revisions as an `ol.pw-revs`: each row has a 24 px thumbnail button, “Revision n · time”, and a note in small text; `aria-current` marks the one shown.
  - The line “Looking changes nothing: no file is replaced and the plan and phase stay as they are.”
- **Actions:** Show in Work (opens the file), Close, and the status's default action.

## States

| State | What shows |
| --- | --- |
| Generating | Tag `Generating` (dotted), `aria-busy`, a dotted 64 px box “1 of 4”, the line “Generating 4 candidates · 0:12” (`role=status`), a bar, “Local: visual-core’s generator on this Mac.”, and **Stop**, which keeps the finished candidates. |
| Success, one | As in Anatomy. |
| Several candidates | The radio group; the default action is “Use Candidate 2 as the App Icon…”. |
| Unsupported file | `.pw-inert` box with the extension. “This kind of file can’t be shown here: .psd.” The help line lists what is shown (PNG, JPEG, GIF, WebP, SVG as an image). **Show in Work**. |
| Missing or deleted | “assets/icons/save/2/save.png is missing: it was deleted or moved after 15:03.” Earlier revisions are named, and if the app used the file, the Preview shows a broken image. **Show Revision 1** · Ask for Another · Look in Trash. |
| Failed | What failed, in plain words, and “Nothing was saved.” **Try Again with “dusk”** (when a fix is known) · Show the Recipe. |
| Generation unavailable | “Image generation isn’t set up on this Mac.” It runs locally once visual-core's tools are installed; no account, no online service. How to Set It Up… · Choose from the Project’s Icons. |
| Unsafe content | An SVG with a script, foreign content or an external reference, or an HTML file: “Not shown: this SVG contains a script.” Every image is drawn through `<img>` (SVG as `image/svg+xml` in an img, never inlined or in an iframe), so nothing in it runs. **Open as Text**. The file is kept. |
| Old message | After a newer revision exists: `.pw-visual--old` (dotted border) and “Revision 1 of 2 · a newer one is below”. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `visual.inspect` | Inspect {name} icon, revision {n} | {name}アイコン（第{n}版）を詳しく見る |
| `visual.tag.proposal` | Proposal | 提案 |
| `visual.tag.generated` | Generated · not used | 生成済み・未使用 |
| `visual.tag.used` | In use | 使用中 |
| `visual.tag.generating` | Generating | 生成中 |
| `visual.help.proposal` | Chosen from the icon library · not in the project yet | アイコン集から選んだもの・まだプロジェクトにありません |
| `visual.help.generated` | Saved in the project · the app doesn’t use it yet | プロジェクトに保存済み・アプリではまだ使っていません |
| `visual.help.used` | Used by {file} | {file} で使用中 |
| `visual.copy` | Copy to Project | プロジェクトにコピー |
| `visual.use` | Use This Icon… | このアイコンを使う… |
| `visual.use_candidate` | Use Candidate {n} as the App Icon… | 案 {n} をアプリのアイコンにする… |
| `visual.inspect_btn` | Inspect | 詳しく見る |
| `visual.another` | Ask for Another | 別の案を頼む |
| `visual.confirm.title` | Use the {name} icon in the app? | {name}アイコンをアプリで使いますか？ |
| `visual.confirm.detail` | Pi changes one file, as one request you can undo: | Pi が 1 つのファイルを変更します。1 回の依頼として元に戻せます： |
| `visual.confirm.ok` | Use Icon | 使う |
| `visual.phase_refused` | Using it changes {file}, and the project is in {phase}. Plan it, or choose Implementation (⌃⌥I). | 使うと {file} が変わりますが、プロジェクトは「{phase}」中です。計画するか、「実装」（⌃⌥I）を選んでください。 |
| `visual.backdrop` | Backdrop: Checker · Light · Dark | 背景：市松・明るい・暗い |
| `visual.zoom` | Zoom: 1× · 4× · 8× · Fit | 拡大：1×・4×・8×・合わせる |
| `visual.looking` | Looking changes nothing: no file is replaced and the plan and phase stay as they are. | 見るだけでは何も変わりません。ファイルは置き換わらず、プランとフェーズもそのままです。 |
| `visual.description` | Description (what a screen reader hears) | 説明（読み上げられる内容） |
| `visual.revisions` | Revisions | 版 |
| `visual.show_in_work` | Show in Work | Work で表示 |
| `visual.generating` | Generating {n} candidates · {time} | {n} 案を生成中・{time} |
| `visual.unsupported` | This kind of file can’t be shown here: {ext}. | この種類のファイルはここでは表示できません：{ext} |
| `visual.missing` | {path} is missing: it was deleted or moved after {time}. | {path} が見つかりません。{time} 以降に削除または移動されました。 |
| `visual.show_rev` | Show Revision {n} | 第{n}版を表示 |
| `visual.failed` | Couldn’t generate the {kind}: {reason}. Nothing was saved. | {kind}を生成できませんでした：{reason}。何も保存していません。 |
| `visual.unavailable` | Image generation isn’t set up on this Mac. | この Mac では画像生成の準備ができていません。 |
| `visual.setup` | How to Set It Up… | 準備のしかた… |
| `visual.unsafe` | Not shown: this SVG contains a script. | 表示していません：この SVG にはスクリプトが含まれています。 |
| `visual.open_text` | Open as Text | テキストで開く |
| `visual.live.ready` | {n} candidates ready | {n} 案ができました |
| `visual.live.used` | {name} icon now used in {file}. Undo is in the done row. | {name}アイコンを {file} で使い始めました。元に戻すには完了行から。 |

## Keyboard and focus

1. Tab order in the card: thumbnail (or the candidate radios, one Tab stop; arrows move) → the actions, default first → links.
2. Return or Space on the thumbnail opens the inspector. Focus goes to the Backdrop radios.
3. Inside the inspector, the Tab order is Backdrop → Zoom → revision thumbnails → Show in Work → Close → the default action.
   - Arrows move within a radio group.
   - `+` and `−` zoom, and `0` fits; these keys work only while focus is in the inspector, so they don't clash with the browser.
   - Esc closes the inspector and returns focus to the thumbnail or radio that opened it.
4. Use This Icon… opens its confirmation with focus on Cancel. Use Icon closes it, and focus goes to the new done row.
5. A disabled Use This Icon… is still focusable (`aria-disabled="true"`) and is described by the reason line, so the reason is read aloud.

## Live announcements

- **The card's `role=status` line:** “Generating 4 candidates”, then “4 candidates ready” (`visual.live.ready`), or the failure sentence.
- **After use:** `visual.live.used`, through the done row's own live region.
- **Never announced:** backdrop, zoom or revision changes; they show on screen.

## Phone

- **Card:** the thumbnail sits above the facts. Buttons wrap to 44 px rows with the default first. Candidates are 64 px.
- **Inspector:** full screen. Close (top left) returns to the message at the same scroll position. The image can be pinched to zoom, with − and + buttons as the alternative. The Backdrop segment is 44 px. A line gives the facts and the description. Revisions opens a sheet; the default action is at the bottom.
- **Narrow, 320 px:** the card stacks, buttons go full width, long paths wrap at “/”, and nothing scrolls sideways.

## Data

```json
{"kind": "icon", "name": "save", "status": "generated", "source": {"type": "generated", "tool": "visual-core", "recipe": "assets/icons/save/save.json", "palette": "meadow"},
 "revisions": [{"n": 1, "file": "assets/icons/save/1/save.png", "at": "2026-10-19T14:58", "note": "first try"},
               {"n": 2, "file": "assets/icons/save/2/save.png", "at": "2026-10-19T15:03", "note": "brighter top, thicker label"}],
 "current": 2, "type": "image/png", "width": 16, "height": 16, "bytes": 1126, "transparent": true,
 "alt": {"en": "Save icon: a blue floppy disk …", "ja": "保存アイコン：…"}, "used_in": [], "safe": true}
```

`status` is derived, never stored: it is `proposal` while the file is outside the project, `used` when `used_in` is non-empty, otherwise `generated`. `safe` is false when an SVG holds `<script>`, event attributes, `<foreignObject>` or external references, or when the file is HTML. Missing is checked when the card is drawn (after a reload too).

## Don't

- Don't inline SVG into the page or put it in an iframe; always `<img>`.
- Don't let looking, choosing a candidate or Ask for Another change any app file, the plan or the phase.
- Don't overwrite a revision or renumber revisions.
- Don't say a generation service will be downloaded, or call one online, without the setup flow's own consent.
- Don't promise the icon is accessible because it has a description: the description is Pi's draft, and the person can edit it in the inspector (open choice below).

## Walkthrough (one Given/When/Then per story)

1. **Inspect.** Given Pi's message holds “Icon · save” tagged “Generated · not used”. When I press “Inspect save icon, revision 2”, then the dialog “Icon save, revision 2” opens with the radio “Checker” checked. When I choose “Dark” and press “Close”, then focus is on “Inspect save icon, revision 2” and app/index.html is unchanged.
2. **Use, then undo.** Given the project is in Implementation. When I press “Use This Icon…”, then “Use Icon”, then a done row says “Used the save icon (revision 2)” and the card is tagged “In use”. When I press “Undo This Request…” and confirm, then app/index.html is as before and assets/icons/save/2/save.png still exists.
3. **Phase refusal.** Given the project is in Discussion. Then “Use This Icon…” is disabled and described by the reason. When I press “Change Phase…”, then the phase menu opens.
4. **Missing file after reload.** Given assets/icons/save/2/save.png was deleted. When I reload, then the card says it is missing and offers “Show Revision 1”. When I press it, then the inspector shows revision 1.
5. **Second Workbench tab.** Given the chat is open in two tabs. When I press “Use Icon” in the first, then the second tab's card is tagged “In use” after its next update.
6. **Unsafe SVG.** Given banner.svg holds a script. Then the card says “Not shown: this SVG contains a script.” and offers “Open as Text”, and no script from the file has run.

## Open product choices

- **Editing the description:** may the person edit it in the inspector, saving it with the revision, or is it Pi's alone? (Drawn read-only.)
- **Undoing Copy to Project:** should it be undoable like any request? (Assumed yes, as one request.)
- **Kinds beyond icons:** the same card shows images and sprites. Should sprite sheets get frame playback?
- **Retention:** how many revisions are kept before older ones go to Trash, or all of them?

## Round 18: preview repairs

- The generating card's bar used an undefined `pw-bar` with inline black. It now reuses the ContextMeter primitive without its tick: `<span class="pw-meter__bar" aria-hidden="true" style="display:block;width:220px;height:10px;--pw-meter:25%"><span class="pw-meter__fill"></span></span>`. The fill counts finished candidates (1 of 4), never time or an estimate; the status text (“Generating 4 candidates · 0:12”) stays the accessible information.
- The inspect dialog's header uses `.pw-dialog__head`, now defined in the Dialog card (Round 18), instead of inline styles. Boards R15_VisualStates and R15_VisualInspect are updated the same way.
