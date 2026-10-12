# Task 14: Agent Interaction (Chat with the Portfolio Agent)

## 🎯 Goal
To implement a feature that allows website visitors to chat with an AI agent that represents the site owner and manages the portfolio. The agent should have a minimalist, typography-driven presence.

## 🛠 Implementation Plan

### 1. Frontend: Chat Interface
- [x] Create a minimalist chat UI component in `js/components.js`.
- [x] Add a chat trigger (e.g., a floating button or a fixed section) to `index.html`.
- [x] Implement message handling logic (sending/receiving messages) using `fetch`.
- [x] Ensure the design matches the "high-impact, minimalist" aesthetic of the site (Tailwind CSS).

### 2. Backend: Agent API
- [x] Create `agent_api.py` using FastAPI or a similar lightweight framework.
- [x] Implement a POST endpoint `/chat` that accepts user messages.
- [x] Integrate an LLM (e.g., via Ollama local endpoint or OpenAI API) to generate responses.
- [x] Configure a strict "Persona" system prompt for the agent.

### 3. TDD Workflow
- [x] **Red**: Write a test for the chat endpoint and verify it fails.
- [x] **Green**: Implement the endpoint and verify it passes.
- [x] **Refactor**: Clean up the code and ensure the UI is responsive.

## 🧪 Verification
- [x] Confirm the chat UI renders correctly in the browser.
- [x] Verify that sending a message to the backend returns a response.
- [x] Test the "persona" to ensure the agent responds as expected.
