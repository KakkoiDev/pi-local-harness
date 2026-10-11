# Migration Spec: Web Components & htmx

## Objective
Transform the portfolio from a collection of static HTML pages into a modern, component-based application that feels like a Single Page Application (SPA) but maintains the simplicity of server-rendered HTML.

## Technical Architecture

### 1. Web Components (Custom Elements)
To avoid repetition and improve maintainability, we will migrate shared UI elements to Vanilla Web Components.
- **Components to build**:
    - `<portfolio-header>`: Integrated navigation and branding.
    - `<portfolio-footer>`: Standardized site footer.
    - `<project-card>`: A reusable component for project previews that accepts attributes for title, description, and link.
- **Styling Strategy**: Since we use Tailwind CSS via CDN, we will use **Light DOM** for components (avoiding Shadow DOM) to ensure Tailwind's global utility classes apply correctly without needing complex CSS injection.

### 2. htmx Integration
We will use htmx to implement "soft" navigation, reducing page load times and improving the user experience.
- **Target Container**: A central `<main id="main-content">` element will serve as the target for all dynamic swaps.
- **Navigation Flow**: 
    - Links (especially project links) will use `hx-get` and `hx-target="#main-content"`.
    - To support deep-linking and browser history, we will use `hx-push-url="true"`.
- **Content Partials**: 
    - Project pages (e.g., `project-ai.html`) will be refactored into "partials" (HTML fragments) that only contain the content for that specific project, removing the redundant header/footer.

## Migration Roadmap
1. **Infrastructure**: Define the `components.js` bundle and include htmx CDN.
2. **Layout Extraction**: Move Header and Footer into Web Components.
3. **Componentization**: Convert the project grid into a series of `<project-card>` elements.
4. **Dynamic Routing**: Implement the htmx swap logic for project details.
5. **Cleanup**: Remove redundant HTML boilerplate from sub-pages.
