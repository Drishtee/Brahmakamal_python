from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.middleware import auth_required
from app.csp_view.permissions import has_csp_access
from app.csp_view.service import get_csp_counts_by_district
from app.csp_view.service import (get_csps_by_block_codes)
from app.csp_view.schemas import CSPResponse

router = APIRouter(
    prefix="/csp-view",
    tags=["CSP View"]
)

def require_csp_access(user):
    email = ""

    if isinstance(user, dict):
        email = user.get("email", "")

    if not has_csp_access(email):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access CSP data."
        )

    return email

@router.get("/access")
def csp_access(user=Depends(auth_required)):
    email = ""

    if isinstance(user, dict):
        email = user.get("email", "")

    return {
        "csp_access": has_csp_access(email)
    }

@router.get("/block-counts")
def csp_block_counts(
    dist_code: int = Query(...),
    user=Depends(auth_required)
):
    require_csp_access(user)

    try:
        return get_csp_counts_by_district(
            dist_code
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to fetch CSP counts: {str(exc)}"
        )
        
        
@router.get("/csps", response_model=List[CSPResponse])
def csp_list(
    block_codes: str = Query(...),
    user=Depends(auth_required)
):
    require_csp_access(user)

    try:
        block_code_list = [
            int(code.strip())
            for code in block_codes.split(",")
            if code.strip()
        ]

        if not block_code_list:
            raise HTTPException(
                status_code=400,
                detail="At least one block code is required."
            )

        block_code_list = list(dict.fromkeys(block_code_list))

        return get_csps_by_block_codes(block_code_list)

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Block codes must be valid integers."
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to fetch CSP list: {str(exc)}"
        )