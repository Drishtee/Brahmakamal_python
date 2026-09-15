from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates

from app.auth.middleware import auth_required

from app.route_management.permissions import has_route_access

from app.route_management.schemas import (
    CreateRouteRequest,
    CreateRouteResponse,
)

from app.route_management.service import (
    COMPANY,
    get_route_states,
    get_route_districts,
    get_route_blocks,
    get_route_offices,
    get_route_villages,
    create_route,
    get_new_route_name
)


router = APIRouter(
    prefix="/route-management",
    tags=["Route Management"]
)


templates = Jinja2Templates(
    directory="app/templates"
)


# =====================================================
# ROUTE ACCESS HELPER
# =====================================================

def require_route_access(user):

    email = ""

    if isinstance(user, dict):
        email = user.get("email", "")

    if not has_route_access(email):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to manage routes."
        )

    return email


# =====================================================
# ROUTE MANAGEMENT PAGE
# =====================================================

@router.get("")
def route_management_page(
    request: Request,
    user=Depends(auth_required)
):

    require_route_access(user)

    return templates.TemplateResponse(
        request=request,
        name="route_management/index.html",
        context={
            "user": user
        }
    )


# =====================================================
# STATES
# =====================================================

@router.get("/states")
def states(
    user=Depends(auth_required)
):

    require_route_access(user)

    return get_route_states()


# =====================================================
# DISTRICTS
# =====================================================

@router.get("/districts/{state_code}")
def districts(
    state_code: int,
    user=Depends(auth_required)
):

    require_route_access(user)

    return get_route_districts(state_code)


# =====================================================
# BLOCKS
# =====================================================

@router.get("/blocks/{district_code}")
def blocks(
    district_code: int,
    user=Depends(auth_required)
):

    require_route_access(user)

    return get_route_blocks(district_code)


# =====================================================
# OFFICES
# =====================================================

@router.get("/offices/{block_id}")
def offices(
    block_id: int,
    user=Depends(auth_required)
):

    require_route_access(user)

    return get_route_offices(block_id)


# =====================================================
# VILLAGES
# =====================================================

@router.get("/villages/{block_code}")
def villages(
    block_code: int,
    user=Depends(auth_required)
):

    require_route_access(user)

    return {
        "villages": get_route_villages(block_code),
        "minimum_households": 7500,
        "maximum_households": 10000
    }


# =====================================================
# CREATE ROUTE
# =====================================================

@router.post(
    "/routes",
    response_model=CreateRouteResponse
)
def create_new_route(
    request: CreateRouteRequest,
    user=Depends(auth_required)
):

    # -------------------------------------------------
    # 1. CHECK ROUTE ACCESS
    # -------------------------------------------------

    email = require_route_access(user)

    # -------------------------------------------------
    # 2. VALIDATE COMPANY
    # -------------------------------------------------

    if request.company != COMPANY:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported company: {request.company}"
        )

    # -------------------------------------------------
    # 3. VALIDATE VILLAGES
    # -------------------------------------------------

    if not request.village_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one village must be selected."
        )

    # -------------------------------------------------
    # 4. REMOVE DUPLICATE VILLAGE IDs
    # -------------------------------------------------

    village_ids = list(
        dict.fromkeys(request.village_ids)
    )

    # -------------------------------------------------
    # 5. CREATE ROUTE
    # -------------------------------------------------

    try:

        create_route(
            village_ids=village_ids,
            user_id=email,
            block_id=request.block_code,
            office_id=request.office_id
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to create route: {str(exc)}"
        )

    # -------------------------------------------------
    # 6. SUCCESS RESPONSE
    # -------------------------------------------------

    return CreateRouteResponse(
        success=True,
        message="Route created successfully."
    )
    
# =====================================================
# NEW ROUTE NAME
# =====================================================

@router.get(
    "/route-name/{block_code}"
)
def route_name(
    block_code: int,
    user=Depends(auth_required)
):

    require_route_access(user)

    try:

        return {
            "route_name": get_new_route_name(block_code)
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate route name: {str(exc)}"
        )
        
        
# =====================================================
# NEW ROUTE NAME
# =====================================================

@router.get(
    "/route-name/{block_code}"
)
def route_name(
    block_code: int,
    user=Depends(auth_required)
):

    require_route_access(user)

    try:

        return {
            "route_name": get_new_route_name(block_code)
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate route name: {str(exc)}"
        )