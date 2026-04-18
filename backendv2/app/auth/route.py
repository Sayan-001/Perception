from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.schemas import Token, UserCreate, UserLogin, UserOut
from app.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    user = await AuthService.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return await AuthService.create_user(db, user_in)


@router.post("/login", response_model=Token)
async def login(
    user_in: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await AuthService.authenticate_user(db, user_in.email, user_in.password)
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

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = AuthService.create_access_token(
        subject=user.email,
        role=(
            user.user_type.value
            if hasattr(user.user_type, "value")
            else str(user.user_type)
        ),
    )

    return {"access_token": access_token, "token_type": "bearer"}
