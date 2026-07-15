from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from app.auth.router import router as auth_router
from app.geo.router import router as geo_router

app = FastAPI()

# Handle auth redirects
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 307 and "Location" in exc.headers:
        return RedirectResponse(url=exc.headers["Location"])
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/auth/login")

app.include_router(auth_router)
app.include_router(geo_router)