from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# User Registration
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)

# User Login
class UserLogin(BaseModel):
    username: str
    password: str

# User Response (what we send back)
class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    full_name: Optional[str]
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
