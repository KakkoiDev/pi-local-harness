"""Recipe offline-phone (offline half): cut the browser's connection and check what the person sees.

context.set_offline(True) makes navigator.onLine false and fires the page's `offline` event; set_offline(False)
brings it back. expect() waits for the banner: no sleeps.
"""
from playwright.sync_api import expect


def test_going_offline_shows_the_banner_and_disables_add(signed_in_page):
    banner = signed_in_page.get_by_role("status").filter(has_text="offline")
    add = signed_in_page.get_by_role("button", name="Add")
    expect(banner).to_be_hidden()

    signed_in_page.context.set_offline(True)

    expect(banner).to_be_visible()
    expect(add).to_be_disabled()


def test_coming_back_online_hides_the_banner(signed_in_page):
    signed_in_page.context.set_offline(True)
    expect(signed_in_page.get_by_role("button", name="Add")).to_be_disabled()

    signed_in_page.context.set_offline(False)

    expect(signed_in_page.get_by_role("status").filter(has_text="offline")).to_be_hidden()
    expect(signed_in_page.get_by_role("button", name="Add")).to_be_enabled()
