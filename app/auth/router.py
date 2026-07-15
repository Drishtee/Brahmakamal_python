from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.auth.service import authenticate_user
from app.auth.jwt import create_session, verify_session

router = APIRouter(prefix="/auth", tags=["Auth"])
templates = Jinja2Templates(directory="app/templates")

# 🔹 GET Login Page
@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(
    request=request,
        name="auth/login.html",
        context={
            "error": None
    }
)


#  Login
@router.post("/login", response_class=HTMLResponse)
def login(request: Request, username: str = Form(...), password: str = Form(...)):
    
    result = authenticate_user(username, password)
    print(result)
    if result["success"]:
        token = create_session({
            "username": username,
            "email": result["email"],
            "first_name": result["first_name"]
            
            
        })
        print("TOKEN DATA:")
        print(verify_session(token))
        response = RedirectResponse(url="/geo/dashboard", status_code=302)
        response.set_cookie(key="session", value=token, httponly=True)
        
        return response

    return templates.TemplateResponse(
        request=request,
        name="auth/login.html",
        context={
            "error": result["message"]
    }
)

#  Logout
@router.get("/logout")
def logout():
    response = RedirectResponse(url="/auth/login")
    response.delete_cookie("session")
    return response


#  Current User
@router.get("/me")
def get_me(request: Request):
    token = request.cookies.get("session")
    user = verify_session(token) if token else None

    if not user:
        return {"authenticated": False}

    return {"authenticated": True, "user": user}