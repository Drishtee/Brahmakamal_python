from fastapi import Request
from fastapi.responses import RedirectResponse

def auth_required(request: Request):
    token = request.cookies.get("session")
    
    from app.auth.jwt import verify_session
    user = verify_session(token) if token else None

    if not user:
        # Raise — never return — inside a Depends()
        from fastapi import HTTPException
        raise HTTPException(
            status_code=307,
            headers={"Location": "/auth/login"},
            detail="Not authenticated"
        )

    return user