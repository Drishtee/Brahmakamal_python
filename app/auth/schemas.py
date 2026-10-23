from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    success: bool
    email: Optional[str] = None
    message: Optional[str] = None