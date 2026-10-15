from geometry import area_rect


def total_area(rectangles):
    return sum(area_rect(w, h) for w, h in rectangles)
