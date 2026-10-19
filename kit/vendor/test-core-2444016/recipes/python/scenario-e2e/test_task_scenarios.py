"""Recipe scenario-e2e: each Given/When/Then scenario of a task is one e2e test named after the scenario's title.

The scenarios: recipes/shared/task-example.md. Started from `python3 tools/scenarios.py skeleton TASK.md --lang python`;
`python3 tools/scenarios.py check TASK.md --tests <this file>` proves every scenario has its test.
Given = Arrange, When = Act, Then = Assert.
"""
import pytest
from playwright.sync_api import expect


def add_task(page, title):
    page.get_by_label("New task").fill(title)
    page.get_by_role("button", name="Add").click()


@pytest.mark.scenario("Add a task")
def test_add_a_task(signed_in_page):
    # Given I am signed in with an empty list
    page = signed_in_page
    expect(page.get_by_role("listitem")).to_have_count(0)
    # When I add the task "Buy milk"
    add_task(page, "Buy milk")
    # Then I see "Buy milk" in the list
    expect(page.get_by_role("list", name="Tasks").get_by_role("listitem").filter(has_text="Buy milk")).to_be_visible()
    # And the count says "1 task"
    expect(page.locator("#count")).to_have_text("1 task")


@pytest.mark.scenario("Delete a task")
def test_delete_a_task(signed_in_page):
    # Given I am signed in with the task "Buy milk"
    page = signed_in_page
    add_task(page, "Buy milk")
    row = page.get_by_role("listitem").filter(has_text="Buy milk")
    expect(row).to_be_visible()
    # When I delete "Buy milk"
    row.get_by_role("button", name="Delete").click()
    # Then the list is empty
    expect(page.get_by_role("listitem")).to_have_count(0)
    # And the count says "0 tasks"
    expect(page.locator("#count")).to_have_text("0 tasks")


@pytest.mark.scenario("An empty title is not added")
def test_an_empty_title_is_not_added(signed_in_page, app_url):
    # Given I am signed in with an empty list
    page = signed_in_page
    expect(page.get_by_role("listitem")).to_have_count(0)
    # When I add a task with an empty title (spaces pass the browser's `required`, the server refuses them)
    with page.expect_response("**/api/tasks") as response:
        add_task(page, "   ")
    assert response.value.status == 422
    # Then the list is still empty
    expect(page.get_by_role("listitem")).to_have_count(0)
