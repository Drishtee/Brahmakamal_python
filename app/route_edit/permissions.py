from app.route_management.permissions import has_route_access


def require_route_edit_access(email):
    if not email:
        return False

    return has_route_access(email)