def page(items, number, size):
    """The items on page `number` (counting from 1), `size` per page."""
    start = (number - 1) * size - 1 if number > 1 else 0
    return items[start:start + size]
