"""Recipe scenario-steps: the steps of recipes/shared/task-example.md, one function per level, all from primitives.

The vocabulary is recipes/shared/task-example.vocab.json (`python3 tools/vocab.py check TASK.md --vocab ...` refuses
any other step). Each phrase has a unit function (the pure task list, sample_app/tasks.py), an integration function
(the routes, through FastAPI's TestClient) and an e2e function (the page, in a browser). The three test files of this
recipe run the same scenarios at the three levels.
"""
from functional import Registry
from functional.primitives import (click, control, expect_count, expect_text, fill, goto, expect_visible, http_client,
                                   temp_database)
from sample_app.app import TEST_USERS, create_app  # replace with your app
from sample_app.tasks import add_task, count_text, delete_task

EMAIL, PASSWORD = next(iter(TEST_USERS.items()))
steps = Registry()


# ---------------------------------------------------------------- unit: the pure task list


@steps.step("Given I am signed in with an empty list", level="unit")
def unit_empty_list(world):
    world.tasks = ()


@steps.step("Given I am signed in with the task {title}", level="unit")
def unit_one_task(world, title):
    world.tasks = add_task((), title)


@steps.step("When I add the task {title}", level="unit")
def unit_add(world, title):
    world.tasks = add_task(world.tasks, title)


@steps.step("When I add a task with an empty title", level="unit")
def unit_add_empty(world):
    try:
        world.tasks = add_task(world.tasks, "")
    except ValueError as error:
        world.error = str(error)


@steps.step("When I delete {title}", level="unit")
def unit_delete(world, title):
    world.tasks = delete_task(world.tasks, title)


@steps.step("Then I see {title} in the list", level="unit")
def unit_sees(world, title):
    expect_text(" | ".join(task["title"] for task in world.tasks), title)


@steps.step("Then the count says {text}", level="unit")
def unit_count(world, text):
    expect_text(count_text(len(world.tasks)), text, exact=True)


@steps.step("Then the list is empty", level="unit")
@steps.step("Then the list is still empty", level="unit")
def unit_empty(world):
    expect_count(world.tasks, 0)


# ---------------------------------------------------------------- integration: the routes


def _api_titles(world) -> list[str]:
    response = world.client.get("/api/tasks")
    assert response.status_code == 200, response.text
    return [task["title"] for task in response.json()]


@steps.step("Given I am signed in with an empty list", level="integration")
def api_signed_in(world):
    world.client = http_client(create_app(temp_database(world.tmp_path)))
    assert world.client.post("/api/login", json={"email": EMAIL, "password": PASSWORD}).status_code == 200


@steps.step("Given I am signed in with the task {title}", level="integration")
def api_one_task(world, title):
    api_signed_in(world)
    api_add(world, title)


@steps.step("When I add the task {title}", level="integration")
def api_add(world, title):
    world.response = world.client.post("/api/tasks", json={"title": title})


@steps.step("When I add a task with an empty title", level="integration")
def api_add_empty(world):
    api_add(world, "")
    assert world.response.status_code == 422, world.response.text


@steps.step("When I delete {title}", level="integration")
def api_delete(world, title):
    task = next(t for t in world.client.get("/api/tasks").json() if t["title"] == title)
    assert world.client.delete(f"/api/tasks/{task['id']}").status_code == 204


@steps.step("Then I see {title} in the list", level="integration")
def api_sees(world, title):
    assert title in _api_titles(world)


@steps.step("Then the count says {text}", level="integration")
def api_count(world, text):
    expect_text(count_text(len(_api_titles(world))), text, exact=True)


@steps.step("Then the list is empty", level="integration")
@steps.step("Then the list is still empty", level="integration")
def api_empty(world):
    expect_count(_api_titles(world), 0)


# ---------------------------------------------------------------- e2e: the page in a browser


def _row(world, title):
    tasks = control(world.page, role="list", name="Tasks")
    return tasks.get_by_role("listitem").filter(has_text=title)


@steps.step("Given I am signed in with an empty list", level="e2e")
def page_signed_in(world):
    response = world.page.request.post(f"{world.base_url}/api/login", data={"email": EMAIL, "password": PASSWORD})
    assert response.ok, response.text()
    goto(world.page, world.base_url)
    expect_visible(control(world.page, role="button", name="Sign out"))  # the state, not a time


@steps.step("Given I am signed in with the task {title}", level="e2e")
def page_one_task(world, title):
    page_signed_in(world)
    page_add(world, title)
    expect_visible(_row(world, title))


@steps.step("When I add the task {title}", level="e2e")
def page_add(world, title):
    fill(control(world.page, label="New task"), title)
    click(control(world.page, role="button", name="Add"))


@steps.step("When I add a task with an empty title", level="e2e")
def page_add_empty(world):
    page_add(world, "")


@steps.step("When I delete {title}", level="e2e")
def page_delete(world, title):
    click(control(_row(world, title), role="button", name="Delete"))


@steps.step("Then I see {title} in the list", level="e2e")
def page_sees(world, title):
    expect_visible(_row(world, title))


@steps.step("Then the count says {text}", level="e2e")
def page_count(world, text):
    expect_text(control(world.page, css="#count"), text, exact=True)


@steps.step("Then the list is empty", level="e2e")
@steps.step("Then the list is still empty", level="e2e")
def page_empty(world):
    expect_count(control(world.page, role="list", name="Tasks").get_by_role("listitem"), 0)
