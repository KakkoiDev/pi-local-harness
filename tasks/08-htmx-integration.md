# Task 08: htmx Dynamic Routing

## Goal
Implement seamless page transitions using htmx, transforming the site into a hybrid SPA.

## Requirements
- [ ] Update `index.html` to include a target container: `<main id="main-content">`.
- [ ] Convert navigation links to use `hx-get` and `hx-target="#main-content"`.
- [ ] Update project links to use `hx-get` and `hx-push-url="true"`.
- [ ] Create "partials" for the project pages:
    - Transform `project-ai.html` and `project-db.html` into fragments that contain only the inner content (no `<html>`, `<body>`, or layout wrappers).
- [ ] Implement a basic error handler for htmx requests.

## Acceptance Criteria
- Navigating to a project page does not trigger a full browser refresh.
- The URL updates in the address bar upon navigation.
- Content swaps smoothly into the `#main-content` area.
