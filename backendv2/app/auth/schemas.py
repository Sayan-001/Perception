from pydantic import BaseModel, EmailStr

from app.core.model import UserType


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    email: str
    role: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    user_type: UserType


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    email: EmailStr
    full_name: str
    user_type: UserType
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}
