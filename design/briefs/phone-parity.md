# Brief: the phone does everything the desktop does

Date: 2026-10-15. Round 8. Published for the designer as an artifact (https://claude.ai/artifact/KaCVD5Xqv1tVD68VTRSpQS) with screenshots (the audit's, from a scratch workbench at 390 × 844 with touch).

The person: "the phone UI/UX is not on par with the desktop UI/UX. There are actions that are impossible to perform on mobile."

## The rule this brief asks the design to keep

Every action the desktop offers can be done on the phone, in the phone's own way (sheets, ⋯, 44 px targets, no hover, no keyboard), and is found where a person would look for it. Where the desktop has a menu command, the phone has a path of at most three taps from the screen the command acts on. An action that truly makes no sense on a phone (Close Window, desktop pattern) is named as such, not silently absent.

## Impossible on the phone today

1. **Model and thinking level.** The only controls are in the desktop menu bar, which the phone hides. The person cannot switch to a model that sees images or thinks, and cannot recover when the chosen model is gone (the toast says to choose another). *Designed but not built:* Ph_Model, Ph_ModelList (a Model group in the π sheet).
2. **Rename, move or trash a file or folder.** Only the File menu has them. *Designed but not built:* Ph_FileMore (the open file's ⋯: Rename or Move…, Copy Path, Ask Pi About This File…, Download Draft…, Move to Trash…), Ph_FolderMore (a folder opens as its own level with a ⋯). Today a tapped folder expands inline and offers nothing.
3. **Review.** Three failures:
   - on a fresh phone, "Comments N" opened only the dither scrim: Review's closed/open state came from the desktop default (closed under 1100 px). Fixed in the code since (2026-10-15);
   - "Comments" shows only while the file has an open comment: with none, or only resolved or deleted ones, there is no way into Review, so resolved comments cannot be reopened or restored;
   - "Ask Pi about this whole file" lives inside Review, so it is unreachable in the same cases.
   *Never designed:* Review with 0 open comments.
4. **Ask Pi about a selection or block.** "Ask Pi…" from the selection bar or the block sheet opens the Comment composer; the question lands in a hidden field. The person can only ask by making a comment.
5. **Markdown source.** "As Markdown Source" lives in the desktop ruler, which the phone hides. Only one block at a time can be turned into Raw Markdown. *Never designed* on the phone.
6. **Stop or Start the app in the Preview.** The phone foot (Ph_Preview) has the state, the app's language and Open App, but no Stop / Start; only Start Again after an error. *Not drawn.*
7. **Reload from Disk** outside a save failure. Minor. *Never designed.*

## Awkward

- **Navigation from a document.** π, the view menu and the status button are hidden on a document screen; going to Chat takes three taps (‹ Files, the view menu, Chat). Agent status on document screens: PhoneEdit1 replaces it with Saved — keep that?
- **Landing spots.** The status button and "Show in Activity" land on the Activity list, "Show in Gate" on the Gate list, not on the request's or check's detail.
- **New Project / Add Existing Folder** on the phone: the folder browser in an 88vh sheet shows about one row. Ph_NewProject draws a simpler "Create in ~/code".
- **Targets under 44 px:** "Show resolved" checkbox (14 px), radios (14 px), thread ‹ › (37 px), Dictate (32 px), the whole-file summary row (32 px).
- **Desktop shortcut hints on the phone:** "⇧⌘M" in the selection bar, "Undo ⌘Z" in the toast, "Refresh ⌘R" in Gate, "⌘." on Stop.
- **The toast** covers the edit bar (Block style, Done) for 8 s.
- **Settings** shows Desktop pattern and "Return sends", which do nothing on a phone.
- **Gate rows** have no project link on the phone.
- **File paths** are not visible anywhere on the phone (a desktop tooltip).

## Better on the phone (keep, and maybe bring to the desktop)

- The ⋯ on each project row acts on any project without opening it (the desktop Project menu acts only on the open project).
- The block sheet's Turn Into grid, the bottom selection bar, the thread sheet with "Comment N of M" and ‹ ›.
- Segmented filters and two-line Activity and Gate rows; Open App (Add to Home Screen).

## What the boards say that the code does not do (we will build these once confirmed)

Ph_Model and Ph_ModelList; Ph_FileMore and Ph_FolderMore; the PhoneBar README's "the π sheet holds every menu command" (today it holds projects, Agent, New/Add, Settings and About only); Ph_FirstChat's "Open the Plan" button; Ph_Offline's phone copy ("Can't reach the Mac…"); Ph_NewProject's simple sheet.

Boards that disagree: Ph_FilesNew draws "‹ Projects" in the Files info bar; Ph_Files does not (the code follows Ph_Files).

## Questions

1. **Model and thinking:** build Ph_Model and Ph_ModelList as drawn?
2. **Files and folders:** build Ph_FileMore and Ph_FolderMore as drawn, including folders opening as a level?
3. **Review entry:** show "Comments" (or "Review") at 0 open comments, so resolved and deleted ones and the whole-file question are reachable? (The code will stop taking Review's phone state from the desktop default either way: that one is a bug.)
4. **Ask Pi on the phone:** from a selection or a block, open the whole-file question sheet with the quote, or a separate Ask sheet?
5. **Markdown source on the phone:** a "View as Markdown" item in the file ⋯, or desktop-only on purpose?
6. **Preview Stop / Start on the phone:** in the foot, in the view menu's key text, or a ⋯?
7. **Landing spots:** should the status button, Show in Activity and Show in Gate open the detail on the phone?
8. **Agent status on document screens:** hidden (PhoneEdit1) or beside Saved / Comments?
9. **New Project and Add Folder:** Ph_NewProject's fixed "Create in ~/code", or the folder browser as its own full-height step?
10. **Details:** 44 px minimums for the listed controls; no ⌘ hints on the phone; the toast above the edit bar or composer; hide Desktop pattern and "Return sends" in phone Settings.
11. **"‹ Projects" in Files:** Ph_FilesNew or Ph_Files?
12. **The π sheet:** is it "every menu command" (PhoneBar README), or should commands live next to what they act on (⋯ on the file, the folder, the project), with the π sheet keeping only app-wide ones? The second is what the drawn ⋯ sheets already do.
