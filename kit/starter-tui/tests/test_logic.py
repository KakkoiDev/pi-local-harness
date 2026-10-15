from app.logic.notes import MAX_TITLE, Problem, check_title


def test_a_title_is_trimmed_and_must_say_something() -> None:
    assert check_title("  buy   milk ") == ("buy milk", [])
    assert check_title("   ") == ("", [Problem("title", "error.title_empty")])
    assert check_title("x" * (MAX_TITLE + 1))[1] == [Problem("title", "error.title_long")]
