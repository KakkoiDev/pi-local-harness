# Task 12: Add and delete tasks

The person can add a task to the list and delete it again.

## Scenarios

### Scenario: Add a task
- Given I am signed in with an empty list
- When I add the task "Buy milk"
- Then I see "Buy milk" in the list
- And the count says "1 task"

### Scenario: Delete a task
- Given I am signed in with the task "Buy milk"
- When I delete "Buy milk"
- Then the list is empty
- And the count says "0 tasks"

### Scenario: An empty title is not added
- Given I am signed in with an empty list
- When I add a task with an empty title
- Then the list is still empty
