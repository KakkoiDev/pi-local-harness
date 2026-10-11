# Task 07: Project Componentization

## Goal
Create a reusable `<project-card>` component to standardize how projects are displayed across the site.

## Requirements
- [ ] Implement `<project-card>`:
    - Acceptance of attributes: `title`, `description`, `link`, `tags`.
    - Handle internal HTML generation using these attributes.
    - Apply the "group" and "hover:underline" Tailwind styles from the original design.
- [ ] Refactor the projects section in `index.html` to use a loop or a series of `<project-card>` elements.
- [ ] Verify that clicking a card still directs the user to the correct project page.

## Acceptance Criteria
- Project cards are rendered via the custom element.
- Adding a new project only requires adding one new `<project-card>` element with attributes.
