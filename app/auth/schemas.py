from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    success: bool
    email: str | None = None
    message: str | None = None