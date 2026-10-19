"""Recipe offline-phone (phone half): the same app at a phone's size, with touch.

Overriding browser_context_args in this file makes every test here run in a phone-sized context (390 x 844, like an
iPhone 14). Checks: nothing scrolls sideways, the main action is on screen, a tap works.
"""
import pytest
from playwright.sync_api import expect

PHONE = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 3, "is_mobile": True, "has_touch": True}


@pytest.fixture
def browser_context_args(browser_context_args):
    return {**browser_context_args, **PHONE}


def test_nothing_scrolls_sideways_on_a_phone(signed_in_page):
    signed_in_page.get_by_label("New task").fill("A rather long task title that has to wrap on a narrow phone screen")
    signed_in_page.get_by_role("button", name="Add").tap()
    expect(signed_in_page.locator("#count")).to_have_text("1 task")

    overflow = signed_in_page.evaluate("document.documentElement.scrollWidth - window.innerWidth")

    assert overflow <= 0


def test_the_main_action_is_on_screen_and_tappable(signed_in_page):
    add = signed_in_page.get_by_role("button", name="Add")

    expect(add).to_be_in_viewport()
    box = add.bounding_box()
    assert box["height"] >= 44  # a finger-sized target
