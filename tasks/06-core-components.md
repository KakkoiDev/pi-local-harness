# Task 06: Core Layout Components

## Goal
Eliminate HTML duplication by creating reusable Web Components for the site's global layout.

## Requirements
- [ ] Implement `<portfolio-header>`:
    - Migrate the current header HTML into the component.
    - Ensure the "KAKKOI" branding and navigation links are preserved.
- [ ] Implement `<portfolio-footer>`:
    - Migrate the current footer HTML into the component.
- [ ] Update `index.html` to use these components instead of raw HTML.
- [ ] Ensure Tailwind styles are still applying (using Light DOM).

## Acceptance Criteria
- The page layout remains visually identical after replacing raw HTML with custom elements.
- Header and Footer are defined only once in `components.js`.
