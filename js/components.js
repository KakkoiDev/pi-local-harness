class PortfolioHeader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <header class="mx-auto max-w-3xl px-4 py-6 flex justify-between items-center">
                <a href="/" class="font-display text-2xl tracking-wider" hx-get="/" hx-select="#main-content" hx-target="#main-content" hx-push-url="true">CreativeDev</a>
                <nav class="flex gap-6 text-sm font-medium">
                    <a href="/#about" class="hover:text-gray-500 transition-colors">About</a>
                    <a href="/#projects" class="hover:text-gray-500 transition-colors">Projects</a>
                    <a href="/#contact" class="hover:text-gray-500 transition-colors">Contact</a>
                </nav>
            </header>
        `;
    }
}

class PortfolioFooter extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <footer class="py-8 text-center text-sm text-gray-500">
                &copy; 2026 My Portfolio
            </footer>
        `;
    }
}

class ProjectCard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const title = this.getAttribute('title') || 'Untitled Project';
        const description = this.getAttribute('description') || '';
        const link = this.getAttribute('link') || '#';
        const tags = this.getAttribute('tags') || '';

        this.innerHTML = `
            <a href="${link}" 
               hx-get="${link}" 
               hx-select="#main-content" 
               hx-target="#main-content" 
               hx-push-url="true" 
               class="group">
                <h3 class="text-xl font-bold group-hover:underline">${title}</h3>
                <p class="text-gray-600 text-sm mt-2">${description}</p>
                <span class="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400">${tags}</span>
            </a>
        `;
    }
}

customElements.define('portfolio-header', PortfolioHeader);
customElements.define('portfolio-footer', PortfolioFooter);
customElements.define('project-card', ProjectCard);
