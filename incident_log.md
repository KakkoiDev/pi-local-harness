# 🚨 Incident Log

*This file tracks all logical failures, hallucinations, and reasoning loops to ensure they are analyzed and prevented in the future.*

## 📉 Incident History

### [2026-10-11] Reasoning Loop / Hallucination
- **Type:** Infinite Loop (Repetitive Output)
- **Symptom:** Output of "didn' didn' didn'..." for multiple turns.
- **Root Cause:** An unsuccessful `edit` operation triggered an internal reasoning loop when the pattern matching failed.
- **Resolution:** Manual intervention by user.
- **Systemic Fix:** Implemented "Circuit Breaker" and "Watchdog Protocol" in `AGENT.md`.

## 2026-10-12: Local pi harness startup failures
The old startup never registered a pi extension, Sentinel called a missing loop method, and HTTP handlers initialized Gate after requests ran. Replaced log-only recovery with pi event hooks and corrected handler initialization. A global symlink initially resolved relative imports from the install directory; resolving its real path fixed that. Regression checks now cover actual pi startup, owned services, exact thought repetition, compaction/reasking, canary reinjection, and media paths.

## 2026-10-12: Blanket shell blocking
The default standard Gate profile blocked every bash command, including diagnostics, causing repeated retries. Local coding now defaults to admin; the restricted standard profile remains explicit. Regression tests cover default bash approval, original-proposal auditing, and argument-drift rejection.
