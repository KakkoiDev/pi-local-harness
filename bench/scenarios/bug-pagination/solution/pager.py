def page(items, number, size):
    """The items on page `number` (counting from 1), `size` per page."""
    start = (number - 1) * size
    return items[start:start + size]
