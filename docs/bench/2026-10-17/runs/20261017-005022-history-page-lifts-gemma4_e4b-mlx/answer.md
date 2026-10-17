[CANARY] The reported bug is documented in `tasks/173-activity-back-to-chat-scroll.md`. To confirm and measure the issue (white space at the bottom of the chat view after returning from Activity), I will use the `browser` tool to simulate the described workflow.

I will start by trying to navigate to the chat page (`/chat`) and then simulating the 'Open in Chat' step, assuming the application state is set up by the time the browser call is made (as the preceding task description indicates a live request state).

I will probe for scrollable and positioned elements during the final chat state.

<call>browser{path:/chat,probes:[scrolled,scrollable,positioned],steps:[{goto:{path:/chat}},{click:· Show in Activity link near agent's answer},{click:Open in Chat button in Activity detail}]}<tool_call|>