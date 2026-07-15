from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from app.geo.service import get_states
from app.geo.service import get_districts
from app.geo.service import get_blocks
from app.geo.service import get_villages
from app.auth.middleware import auth_required
from app.geo.service import get_territories
from app.geo.service import get_vatikas
from app.geo.voronoi import (generate_voronoi_geojson)
from app.geo.service import get_routes
from app.geo.routes import generate_routes_geojson

router = APIRouter(prefix="/geo", tags=["Geo"])

#   ENV  (GLOBAL)
env = Environment(
    loader=FileSystemLoader("app/templates"),
    autoescape=True
)

#  Dashboard Route
@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, user=Depends(auth_required)):

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

    template = env.get_template("geo/dashboard.html")

    html = template.render(
        request=request,
        user=safe_user   #  pass user
    )

    return HTMLResponse(content=html)


#  API Route
@router.get("/territories")
def fetch_territories(state_code: int = Query(None)):
    return get_territories(state_code)

@router.get("/states")
def fetch_states():
    return get_states()

@router.get("/districts")
def fetch_districts(state_code: int):
    return get_districts(state_code)

@router.get("/blocks")
def fetch_blocks(dist_code: int):
    return get_blocks(dist_code)

@router.get("/villages")
def fetch_villages(block_codes: str):
    return get_villages(block_codes)


@router.get("/vatikas")
def fetch_vatikas(block_codes: str):
    return get_vatikas(block_codes    )

@router.get("/routes")
def fetch_routes(block_codes: str):

    return get_routes(
        block_codes
    )


@router.get("/voronoi")
def get_voronoi(
    block_codes: str
):

    return generate_voronoi_geojson(
        block_codes
    )

@router.get("/routes_geojson")
def get_routes_geojson(
    block_codes: str
):

    return generate_routes_geojson(
        block_codes
    )