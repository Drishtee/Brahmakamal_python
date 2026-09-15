from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates

from app.auth.middleware import auth_required

from app.route_edit.permissions import require_route_edit_access

from app.route_edit.schemas import (
    EditRouteRequest,
    EditRouteResponse,
)

from app.route_edit.service import (
    get_route_edit_states,
    get_route_edit_districts,
    get_route_edit_blocks,
    get_routes_to_edit,
    get_existing_route_villages,
    get_available_route_villages,
    update_route,
)


router = APIRouter(
    prefix="/route-edit",
    tags=["Route Edit"]
)


templates = Jinja2Templates(
    directory="app/templates"
)


def get_authorized_email(user):
    email = ""

    if isinstance(user, dict):
        email = user.get("email", "")

    if not require_route_edit_access(email):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to edit routes."
        )

    return email


@router.get("")
def route_edit_page(
    request: Request,
    user=Depends(auth_required)
):
    get_authorized_email(user)

    return templates.TemplateResponse(
        request=request,
        name="route_edit/index.html",
        context={
            "user": user
        }
    )


@router.get("/states")
def states(
    user=Depends(auth_required)
):
    get_authorized_email(user)

    return get_route_edit_states()


@router.get("/districts/{state_code}")
def districts(
    state_code: int,
    user=Depends(auth_required)
):
    get_authorized_email(user)

    return get_route_edit_districts(
        state_code
    )


@router.get("/blocks/{district_code}")
def blocks(
    district_code: int,
    user=Depends(auth_required)
):
    get_authorized_email(user)

    return get_route_edit_blocks(
        district_code
    )


@router.get("/routes/{block_code}")
def routes(
    block_code: int,
    user=Depends(auth_required)
):
    get_authorized_email(user)

    return get_routes_to_edit(
        block_code
    )


@router.get("/routes/{route_id}/villages")
def route_villages(
    route_id: int,
    user=Depends(auth_required)
):
    get_authorized_email(user)

    return {
        "existing_villages": get_existing_route_villages(
            route_id
        ),
        "available_villages": get_available_route_villages(
            route_id
        )
    }


@router.put(
    "/routes/{route_id}",
    response_model=EditRouteResponse
)
def edit_route(
    route_id: int,
    request: EditRouteRequest,
    user=Depends(auth_required)
):
    email = get_authorized_email(user)

    added_village_ids = list(
        dict.fromkeys(request.added_village_ids)
    )

    removed_village_ids = list(
        dict.fromkeys(request.removed_village_ids)
    )

    try:

        if added_village_ids:
            update_route(
                route_id=route_id,
                village_ids=added_village_ids,
                user_id=email,
                flag="A"
            )

        if removed_village_ids:
            update_route(
                route_id=route_id,
                village_ids=removed_village_ids,
                user_id=email,
                flag="D"
            )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to update route: {str(exc)}"
        )

    if not added_village_ids and not removed_village_ids:
        return EditRouteResponse(
            success=True,
            message="No changes were made."
        )

    return EditRouteResponse(
        success=True,
        message="Route updated successfully."
    )