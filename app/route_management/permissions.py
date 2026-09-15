from app.geo.service import check_route_access


def has_route_access(email):

    if not email:
        return False

    return check_route_access(email)