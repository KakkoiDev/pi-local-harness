from geometry import rectangle_area


def total_area(rectangles):
    return sum(rectangle_area(w, h) for w, h in rectangles)
