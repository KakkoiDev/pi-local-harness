# Round 6 notes: where terminal Pi differs from the boards

Date: 2026-10-14. Round 6 (the Terminal page, TerminalOutput card) is built as task 171. These are the places where
the repo differs from the boards, or where Pi itself decides. Please redraw the boards with the repo's names, or say
where the repo should change instead.

## Names the repo uses

1. **Models are pulled and removed with `/models`, not `/ollama`.** T_Changes draws `/ollama rm llama3.2:3b` and
   `/ollama pull llama3.2:3b`. The repo has `/models pull <name>` and `/models remove <name>`; remove moves the model's
   files to the Trash, so its rows read "Moves · its manifest and N files only it uses, to the Trash", "Frees · 2.0 GB
   when you empty the Trash", "Undo · Put Back in the Finder, then merge into <models folder>". `/ollama` is for Ollama's
   own settings (`/ollama set <key> <value>`, `/ollama restart`). T_Outputs' hint "/ollama for pull and remove" should
   say `/models pull · /models remove`.
2. **A setting is changed with `/config set <key> <value>`.** T_Outputs and T_Wayfinding draw `/config <key> <value>`.
   In the repo, `/config <key>` explains one setting and `/config set <key> <value>` changes it (asks first). There is
   no `/config all`: `/config` already lists every setting.
3. **The model choice is saved in `model.json`**, not `config.json` (T_Changes, "Saved in"). config.json holds the
   settings; model.json holds the chosen model and thinking level, which the web menus change too.
4. **There are 15 settings, not 14**, and none is called `worker_wait_seconds` or `loop_check_seconds`
   (T_Outputs, T_Wayfinding). The worker's wait comes with plan 156 phase 3 (Gate's soft gate) and is not built yet;
   the loop check is fixed at 10 seconds and shows in `/status`. The 15: effort, gate_port, web_port, whisper_model,
   remote_hosts, remote_users, auto_update, silence_seconds, hang_seconds, ollama_url, tailscale, python, web_data,
   gate_auth, audit_log.
5. **There is no `/doctor fix lock`** (T_Outputs). `/doctor` says what is wrong and what to do; a lock left by an
   agent that is gone clears itself the next time an agent starts. Should `/doctor` offer fixes as commands? If yes,
   which ones (each would ask first, like every change)?
6. **There is no `/job <id> stop`** (T_Gate, refusal). A request stops with Esc in terminal Pi, the Stop button in the
   web Activity, or ⌘. in the workbench. The refusal's next step reads "/queue shows it · stop it in the web Activity,
   then send yours again".
7. **`/queue all`** works and is the same as `/queue`. `/job` takes the first 8 characters of an id, as `/queue` shows.

## Behaviour that differs

8. **A terminal question is refused, not queued**, while another request runs (T_Gate draws "Yours waits in the queue,
   first in first out"). Terminal Pi is the same agent as the workbench, but its turns are not Activity requests: they
   are refused with "■ Another request is running. Pi works on one request at a time; yours was not sent." Should a
   terminal question join the queue instead? That is a larger change (the terminal turn would wait for its slot).
9. **Recovery re-asks once by itself** (T_Gate draws "Ask again with a hint, or /job f954b438 for the record"). A loop or
   hang in terminal Pi stops the turn, then Pi asks itself again another way, once: the next step reads "Pi asks again
   another way · Esc stops it". If that also fails: "✗ Harness stopped retrying. The problem came back after one retry;
   the incident is saved in <session.log>." with "Ask again with a hint, or in other words". A terminal turn has no
   Activity record, so there is no /job to point to.
10. **The confirmation is Pi's own select list** (T_Changes). The title and the rows ("Model  gemma4 → qwen3:8b",
    "Saved in", "Applies") then the two choices, the action first; Cancel first when the change is destructive. Pi
    marks the chosen row with "→", not inverse, and draws its own key hint ("↑↓ navigate · enter select · escape
    cancel"). The board's "Return switches · Esc cancels" is not ours to draw.
11. **The web Activity does not clear the terminal footer** (T_Footer: "It returns to normal when you open /queue or
    the web Activity"). The web keeps what was seen in the browser; only `/queue` clears the footer today. Clearing it
    from the web needs the server to remember what was seen.

## Not built yet

12. **The footer at 60 columns** (model, state, phone; Gate moves to /status). Pi gives a status item a single line of
    text, not the terminal's width, so the footer is the same at every width. Pi's own footer (folder, context, model)
    stays above it; the model name shows in both.
13. **"○ Loading qwen3:8b…"** in the footer while a model loads, and **"▶ Working · web: <project>"** for a web
    request (T_Workbench). The footer says "▶ Working", or "▶ Working · worker in <project>" for a worker.
14. **The tool rows** (T_Gate) are built for Pi's tools (bash, read, write, edit, grep, find, ls) but not yet seen with a
    real model. A finished read or edit reads "✓ Gate allowed · ✓ done · 0:01" (only bash has an exit code); one that
    fails on its own reads "✗ failed" and "It failed on its own; Gate did not block it."

## Pi's own lines we cannot change

15. Pi prints its own banner above the startup header (version, key hints, "Update Available" when Pi has an update)
    and a tmux warning when the terminal's key format is not csi-u. The harness header follows them.
