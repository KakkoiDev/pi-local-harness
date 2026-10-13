# 107: Projects home, then inside a project

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "the design shows that we have a project selection level and then select the project and see what is inside. we need to implement this separation." Decision: sidebar starts as the project list; choosing one drills in (title bar = project name, ‹ Projects back), in every view.

- [ ] Red (browser): at `/projects` the sidebar lists projects with running/waiting meta; selecting one shows its Plan and Files under a title bar with the project name and a ‹ Projects button.
- [ ] Back to Projects updates the URL (task 106).
