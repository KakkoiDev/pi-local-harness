"""Recipe a11y-smoke: every page state a person sees passes the smoke check, and the keyboard reaches the controls."""
from playwright.sync_api import expect

from a11y_smoke import a11y_problems, tab_until


def test_the_sign_in_page_passes(page, app_url):
    page.goto(app_url)
    expect(page.locator("body")).to_have_attribute("data-ready", "true")

    assert a11y_problems(page) == []


def test_the_task_list_passes_in_both_languages(signed_in_page):
    signed_in_page.get_by_label("New task").fill("Buy milk")
    signed_in_page.get_by_role("button", name="Add").click()
    expect(signed_in_page.get_by_role("listitem")).to_have_count(1)
    assert a11y_problems(signed_in_page) == []

    signed_in_page.get_by_role("button", name="日本語").click()
    expect(signed_in_page.locator("html")).to_have_attribute("lang", "ja")
    assert a11y_problems(signed_in_page) == []


def test_the_keyboard_reaches_sign_in_in_order(page, app_url):
    page.goto(app_url)
    expect(page.locator("body")).to_have_attribute("data-ready", "true")

    tab_until(page, page.get_by_label("Email"))

    assert tab_until(page, page.get_by_role("button", name="Sign in")) == 2  # Email -> Password -> Sign in


def test_the_check_finds_real_problems(page):
    page.set_content('<h1>One</h1><h1>Two</h1><input id="x"><button id="x"><svg></svg></button>'
                     '<img src="cat.png"><a href="/" tabindex="2">Home</a>')

    problems = a11y_problems(page)

    assert any("no lang" in p for p in problems)
    assert any("exactly one visible <h1>, found 2" in p for p in problems)
    assert any("<input" in p and "no accessible name" in p for p in problems)
    assert any("<button" in p and "no accessible name" in p for p in problems)
    assert any("no alt" in p for p in problems)
    assert any("positive tabindex" in p for p in problems)
    assert any('id "x"' in p for p in problems)
