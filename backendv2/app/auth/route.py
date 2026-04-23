from datetime import datetime, timezone
from typing import Annotated

from app.auth.schemas import UserCreate, UserOut
from app.auth.service import AuthService
from app.database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    user = await AuthService.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return await AuthService.create_user(db, user_in)


@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await AuthService.authenticate_user(
        db, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    setattr(user, "last_login_at", datetime.now(timezone.utc))
    await db.commit()

    access_token = AuthService.create_access_token(
        email=user.email,
        role=(
            user.user_type.value
            if hasattr(user.user_type, "value")
            else str(user.user_type)
        ),
    )

    return {"access_token": access_token}
