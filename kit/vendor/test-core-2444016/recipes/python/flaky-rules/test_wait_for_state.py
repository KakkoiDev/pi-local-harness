"""Recipe flaky-rules: wait for the state, never for time. Each test shows one way to wait.

`python3 tools/flaky_lint.py <tests>` finds sleeps, fixed waits, focused tests, network-idle waits and real hosts.
"""
from playwright.sync_api import expect


def test_expect_retries_until_the_text_is_there(signed_in_page):
    signed_in_page.get_by_label("New task").fill("Buy milk")
    signed_in_page.get_by_role("button", name="Add").click()

    # expect() retries until the count changes (default up to 5 s): no sleep before it.
    expect(signed_in_page.locator("#count")).to_have_text("1 task")


def test_wait_for_the_response_the_action_causes(signed_in_page):
    signed_in_page.get_by_label("New task").fill("Buy milk")

    with signed_in_page.expect_response(lambda r: r.url.endswith("/api/tasks") and r.request.method == "POST") as info:
        signed_in_page.get_by_role("button", name="Add").click()

    assert info.value.status == 201


def test_wait_for_a_value_that_is_not_on_the_page(signed_in_page):
    signed_in_page.get_by_label("New task").fill("Buy milk")
    signed_in_page.get_by_role("button", name="Add").click()

    # A value only scripts can see: wait_for_function polls it in the page.
    signed_in_page.wait_for_function("document.querySelectorAll('#task-list li').length === 1")


def test_each_test_starts_from_its_own_data(signed_in_page):
    # app_url gives every test a fresh database: no test depends on another having run first.
    expect(signed_in_page.locator("#count")).to_have_text("0 tasks")
