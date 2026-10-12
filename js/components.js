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

class AgentChat extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.render();
    }

    sendMessage(event) {
        event.preventDefault();
        const input = this.querySelector('#chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage('user', message);
            input.value = '';
            
            // Show a loading state/indicator (optional but nice)
            const loadingId = this.addLoadingMessage();

            fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            })
            .then(response => response.json())
            .then(data => {
                this.removeLoadingMessage(loadingId);
                if (data.reply) {
                    this.addMessage('agent', data.reply);
                } else {
                    this.addMessage('agent', "Error: Received unexpected response format.");
                }
            })
            .catch(error => {
                this.removeLoadingMessage(loadingId);
                console.error('Error:', error);
                this.addMessage('agent', "Error: Could not connect to the Agent API. Make sure it is running.");
            });
        }
    }

    addLoadingMessage() {
        const list = this.querySelector('#message-list');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-message';
        loadingDiv.className = 'mb-4 text-left italic text-gray-400 text-xs';
        loadingDiv.textContent = 'Agent is thinking...';
        list.appendChild(loadingDiv);
        return loadingDiv.id;
    }

    removeLoadingMessage(id) {
        const loadingElement = document.getElementById(id);
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    addMessage(sender, text) {
        const list = this.querySelector('#message-list');
        const msgDiv = document.createElement('div');
        msgDiv.className = `mb-4 ${sender === 'user' ? 'text-right' : 'text-left'}`;
        
        const innerText = document.createElement('span');
        innerText.className = `inline-block px-3 py-2 text-sm ${
            sender === 'user' 
            ? 'bg-black text-white rounded-l-lg rounded-tr-lg' 
            : 'bg-gray-100 text-black rounded-r-lg rounded-tl-lg'
        }`;
        innerText.textContent = text;
        
        msgDiv.appendChild(innerText);
        list.appendChild(msgDiv);
        
        // Scroll to bottom
        const container = this.querySelector('#chat-container');
        container.scrollTop = container.scrollHeight;
    }

    render() {
        this.innerHTML = `
            <div class="fixed bottom-6 right-6 z-50">
                <!-- Trigger Button -->
                <button id="chat-toggle" class="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95">
                    <span class="font-display text-xl">${this.isOpen ? '×' : '?'}</span>
                </button>

                <!-- Chat Window -->
                <div id="${this.isOpen ? 'chat-window' : 'chat-window-hidden'}" 
                     class="${this.isOpen ? 'flex' : 'hidden'} flex-col w-80 h-96 bg-white border border-black shadow-2xl mt-4 overflow-hidden transition-all">
                    
                    <!-- Header -->
                    <div class="bg-black text-white px-4 py-2 flex justify-between items-center">
                        <span class="font-display tracking-wider">AGENT_CORE</span>
                        <button id="close-chat" class="text-xs hover:text-gray-400">CLOSE</button>
                    </div>

                    <!-- Messages -->
                    <div id="chat-container" class="flex-1 overflow-y-auto p-4 bg-white">
                        <div id="message-list">
                            <div class="mb-4 text-left">
                                <span class="inline-block px-3 py-2 text-sm bg-gray-100 text-black rounded-r-lg rounded-tl-lg">
                                    System initialized. Ready for input.
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Input -->
                    <form id="chat-form" class="border-t border-black p-2 flex bg-white">
                        <input id="chat-input" type="text" placeholder="Type a message..." 
                               class="flex-1 text-sm outline-none px-2 py-1" autocomplete="off">
                        <button type="submit" class="text-sm font-bold px-2 hover:text-gray-500">SEND</button>
                    </form>
                </div>
            </div>
        `;

        // Re-attach event listeners
        this.querySelector('#chat-toggle').addEventListener('click', () => this.toggleChat());
        if (this.isOpen) {
            this.querySelector('#close-chat').addEventListener('click', () => this.toggleChat());
            this.querySelector('#chat-form').addEventListener('submit', (e) => this.sendMessage(e));
            this.querySelector('#chat-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage(e);
            });
        }
    }
}

customElements.define('portfolio-header', PortfolioHeader);
customElements.define('portfolio-footer', PortfolioFooter);
customElements.define('project-card', ProjectCard);
customElements.define('agent-chat', AgentChat);
