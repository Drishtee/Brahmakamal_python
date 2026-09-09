from fastapi import APIRouter, Request, Depends, Query

from fastapi.responses import HTMLResponse

from jinja2 import Environment, FileSystemLoader

from app.geo.service import get_states
from app.geo.service import get_districts
from app.geo.service import get_blocks
from app.geo.service import get_villages
from app.geo.service import get_territories
from app.geo.service import get_vatikas
from app.geo.service import get_routes
from app.geo.service import get_physical_routes

from app.auth.middleware import auth_required

from app.geo.voronoi import generate_voronoi_geojson

from app.geo.routes import generate_routes_geojson
from app.geo.physical_routes import (
    generate_physical_routes_geojson
)

import os
from urllib.parse import urlsplit, urlunsplit

router = APIRouter(
    prefix="/geo",
    tags=["Geo"]
)


# =====================================================
# ENV (GLOBAL)
# =====================================================

env = Environment(
    loader=FileSystemLoader(
        "app/templates"
    ),
    autoescape=True
)


def static_version(path: str) -> str:
    """
    Add the file's modification timestamp as a cache-busting
    query parameter.

    Example:
        /static/js/dashboard.js
        becomes
        /static/js/dashboard.js?v=1757319542
    """

    # Convert URL path to local filesystem path
    if path.startswith("/static/"):
        file_path = os.path.join(
            "app",
            path.lstrip("/")
        )
    else:
        file_path = path

    try:
        version = int(
            os.path.getmtime(file_path)
        )
    except OSError:
        # If file doesn't exist, return original path
        return path

    parts = urlsplit(path)
    query = parts.query

    if query:
        query += f"&v={version}"
    else:
        query = f"v={version}"

    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            parts.path,
            query,
            parts.fragment
        )
    )

# Register helper with Jinja
env.globals["static_version"] = static_version

# =====================================================
# DASHBOARD ROUTE
# =====================================================

@router.get(
    "/dashboard",
    response_class=HTMLResponse
)
def dashboard(
    request: Request,
    user=Depends(auth_required)
):

    safe_user = {

        "username": "User",

        "first_name": "User",

        "email": ""

    }


    if isinstance(user, dict):

        safe_user["username"] = user.get(
            "username",
            "User"
        )

        safe_user["first_name"] = user.get(
            "first_name",
            "User"
        )

        safe_user["email"] = user.get(
            "email",
            ""
        )


    template = env.get_template(
        "geo/dashboard.html"
    )


    html = template.render(

        request=request,

        user=safe_user

    )


    return HTMLResponse(
        content=html
    )


# =====================================================
# TERRITORIES
# =====================================================

@router.get("/territories")
def fetch_territories(
    state_code: int = Query(None)
):

    return get_territories(
        state_code
    )


# =====================================================
# STATES
# =====================================================

@router.get("/states")
def fetch_states():

    return get_states()


# =====================================================
# DISTRICTS
# =====================================================

@router.get("/districts")
def fetch_districts(
    state_code: int
):

    return get_districts(
        state_code
    )


# =====================================================
# BLOCKS
# =====================================================

@router.get("/blocks")
def fetch_blocks(
    dist_code: int
):

    return get_blocks(
        dist_code
    )


# =====================================================
# VILLAGES
# =====================================================

@router.get("/villages")
def fetch_villages(
    block_codes: str
):

    return get_villages(
        block_codes
    )


# =====================================================
# VATIKAS
# =====================================================

@router.get("/vatikas")
def fetch_vatikas(
    block_codes: str
):

    return get_vatikas(
        block_codes
    )


# =====================================================
# ROUTES
# =====================================================

@router.get("/routes")
def fetch_routes(
    block_codes: str
):

    return get_routes(
        block_codes
    )


# =====================================================
# PHYSICAL ROUTES
# =====================================================

@router.get("/physical_routes")
def fetch_physical_routes(
    block_codes: str
):

    return get_physical_routes(
        block_codes
    )


# =====================================================
# VORONOI
# =====================================================

@router.get("/voronoi")
def get_voronoi(
    block_codes: str
):

    return generate_voronoi_geojson(
        block_codes
    )


# =====================================================
# ROUTES GEOJSON
# =====================================================

@router.get("/routes_geojson")
def get_routes_geojson(
    block_codes: str
):

    return generate_routes_geojson(
        block_codes
    )


# =====================================================
# PHYSICAL ROUTES GEOJSON
# =====================================================

@router.get("/physical_routes_geojson")
def get_physical_routes_geojson(
    block_codes: str
):

    return generate_physical_routes_geojson(
        block_codes
    )