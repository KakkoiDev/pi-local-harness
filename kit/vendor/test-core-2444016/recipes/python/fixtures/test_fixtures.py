"""Recipe fixtures: start a test already signed in and with sample data, from fixtures in conftest.py.

`signed_in_page` signs in through the API (one request), not the form: only the sign-in journey itself goes through
the form. `sample_tasks` adds records made with the builders. Both are function-scoped, so each test starts clean.
"""
from playwright.sync_api import expect


def test_a_signed_in_page_opens_on_the_tasks(signed_in_page):
    expect(signed_in_page.get_by_label("New task")).to_be_visible()
    expect(signed_in_page.get_by_role("button", name="Sign in")).to_be_hidden()


def test_sample_tasks_are_listed(signed_in_page, sample_tasks):
    items = signed_in_page.get_by_role("list", name="Tasks").get_by_role("listitem")

    expect(items).to_contain_text([task["title"] for task in sample_tasks])
    expect(signed_in_page.locator("#count")).to_have_text("3 tasks")


def test_each_test_starts_with_no_tasks(signed_in_page):
    expect(signed_in_page.locator("#count")).to_have_text("0 tasks")
