# Project: Personal Portfolio Website

## Project Goal
To build a high-impact, minimalist, typography-driven portfolio website inspired by `kakkoi.dev`. The site should be fast, lightweight, and easy to deploy.

## Tech Stack
- **Language:** HTML5
- **Styling:** Tailwind CSS (via CDN)
- **Typography:** Google Fonts (Inter, Bebas Neue)
- **Development Server:** Python `http.server` (via `start.sh`)

## 🧠 Agent Memory: Lessons Learned

### ❌ Mistakes to Avoid (Negative Lessons)
- **Large Edits/Corruption:** Avoid using the `edit` tool for large blocks of code or when editing near the end of a file. This can lead to accidental corruption or failed matches. **SOP: Use `write` for significant file updates to ensure integrity.**
- **Local File Access Misconception:** I do not have access to the user's local filesystem (e.g., `/Users/name/Desktop/...`). **SOP: If a user provides a local path, explain that I cannot access it and ask them to upload the file to the chat.**
- **Reasoning Loops & Hallucinations:** If you notice repetitive/gibberish output (e.g., "didn' didn'...") or if you find yourself attempting the same failing command multiple times, you are in a reasoning loop. **SOP: Trigger the "Circuit Breaker." Stop the current approach, perform a diagnostic, and report the state to the user.**

### ✅ Successful Patterns (Positive Lessons)
- **Task-Based Workflow:** Using a `tasks/` folder with individual markdown "tickets" and a `todo.md` dashboard provides excellent context and prevents scope creep.
- **One-Command Startup:** Using a `start.sh` script makes the local development loop seamless.
- **Minimalist Aesthetic:** A centered, narrow-column layout (max-width 768px) works best for the desired typography-driven design.
- **Harness Optimization:** Using `AGENT.md` as a persistent memory/SOP file and a `tasks/` folder allows for structured, stateful engineering.

### 📈 Continuous Learning Log
*This section tracks real-time feedback and patterns observed during the session.*

#### 🌟 User Preferences & Successes
- **Structural Feedback:** The user likes the `todo.md` roadmap with checkboxes and the task-based ticket system.
- **Memory Protocol:** The user prefers a structured handover protocol ("Handshake") via `AGENT.md`.

#### ⚠️ Reliability & Failure Logs (Auto-log after multiple turns of unresolved issues)
*This section is used by the Watchdog to record recurring failures.*

---

## 🛠 Standard Operating Procedures (SOPs)
1. **Task Management:** All tasks must be defined in `tasks/` and indexed in `todo.md`.
2. **Code Integrity:** For any modification involving more than 10 lines of code, prefer `write` over `edit`.
3. **Communication:** Be concise, show file paths clearly, and alert the user if a command is likely to fail due to permissions or environment limits.
4. **Visuals:** When the user refers to images, always check if they are attachments or file paths.
5. **Circuit Breaker (Loop Prevention):** If you detect a repetitive pattern in your own output (e.g., gibberish strings like "didn' didn'...", or repeating the same failing command), **STOP IMMEDIATELY**. Do not attempt further reasoning in that direction. Instead:
    - Perform a diagnostic step (e.g., `ls -la`, `cat`, `pwd`) to ensure your environment context is correct.
    - Acknowledge the error to the user: *"I have detected a reasoning loop/hallucination. I am stopping my current approach and performing a diagnostic check."*
    - Propose a new, non-repetitive direction.
6. **Watchdog Protocol (Self-Auditing):**
    - **The Audit:** At the conclusion of a task, or if a loop is suspected, perform a self-audit of the conversation context.
    - **The Log:** If a loop or logic failure is identified, the agent **must** write an entry to `incident_log.md`.
    - **Evolution:** Following an incident, the agent must propose a specific update to the "Mistakes to Avoid" or "SOPs" in `AGENT.md` to prevent recurrence.
7. **Sanity Check Anchors (Preventing Drift):** Before executing any long-running reasoning or complex series of commands, the agent **must** state its current goal and the intended command. This "anchors" the reasoning to the task and prevents the feedback loop of "thinking about thinking" about a mistake.
8. **Self-Reflection & Evolution (The Learning Loop):**
    - **Log Successes:** When the user provides positive feedback on a specific method, pattern, or tool, add it to "User Preferences & Successes" in `AGENT.md`.
    - **Log Failures:** If a task or technical issue persists across multiple turns or requires significant "trial and error," log the failure and the root cause in `incident_log.md` and update the "Mistakes to Avoid" or "SOPs" accordingly.
    - **Proactive Documentation:** Always update `AGENT.md` at the end of a significant task or when a new lesson is learned.
9. **Regression Testing & TDD (Red-Green-Refactor):**
    - **Mandatory Testing:** All new features and bug fixes must be accompanied by regression tests.
    - **The "Start Red" Protocol:**
        1. **Write the test first**: Create a test case that specifies the desired behavior.
        2. **Verify Failure**: Run the test and confirm it is **red** (fails) before any implementation work begins.
        3. **Implement**: Integrate the feature or fix.
        4. **Verify Success**: Run the test again and confirm it is **green** (passes).
    - **Modification Protocol**: If an existing feature or test needs to change:
        1. **Revert/Comment**: Comment out or revert the previous implementation to isolate the change.
        2. **Confirm Red**: Ensure the test fails again.
        3. **Integrate**: Implement the change and verify it is green.


10. **Git Version Control:**
    - **Continuous Commit:** Every single anomoly or change in state must be committed.
    - **Step-by-Step Auditing**: Commit after writing a test (Red), and commit after the integration makes it pass (Green).
    - **Clear Messages**: Use descriptive commit messages that indicate the state (e.g., "test: add project-card test (red)").

