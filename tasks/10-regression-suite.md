# Task 10: Full Project Regression Suite

## Goal
Implement a comprehensive test suite for all features using a strict TDD (Red-Green-Refactor) approach, with git commits at every state change.

## Scope
### 1. Python Backend/Utils
- [ ] `get_news.py`: Test scraping success and error handling.
- [ ] `get_news_rss.py`: Test RSS parsing and limit logic.
- [ ] `sentinel.py`: Test loop detection similarity threshold.
- [ ] `utils.py`: Test log file creation and appending.

### 2. Frontend Components
- [ ] `<portfolio-header>`: Verify HTML structure and absolute link paths.
- [ ] `<portfolio-footer>`: Verify HTML structure.
- [ ] `<project-card>`: Verify attribute-to-HTML mapping.

### 3. Integration & Routing (htmx)
- [ ] Home $\rightarrow$ Project Page swap.
- [ ] Project Page $\rightarrow$ Home swap (via `hx-select`).
- [ ] Navigation anchor links (e.g., `/#about`).

## TDD & Git Workflow (Strict)
For every single test case:
1. `git commit` (Initial state).
2. Write test $\rightarrow$ Run (Verify **RED**) $\rightarrow$ `git commit`.
3. Implement fix/feature $\rightarrow$ Run (Verify **GREEN**) $\rightarrow$ `git commit`.

## Acceptance Criteria
- 100% of identified features have a corresponding regression test.
- All tests pass.
- Git history shows a clear Red $\rightarrow$ Green progression for every feature.
