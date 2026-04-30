from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_teacher, get_token_data
from app.auth.schemas import Token, UserCreate, UserLogin, UserOut
from app.auth.service import AuthService
from app.database import get_db

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


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Token = Depends(get_token_data),
):
    await AuthService.delete_user(db, email=current_user.email)


@router.get("/associations", response_model=dict, status_code=status.HTTP_200_OK)
async def get_association(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Token = Depends(get_token_data),
):
    return await AuthService.get_associations(
        db, email=current_user.email, role=current_user.role
    )


@router.post("/associations", status_code=status.HTTP_201_CREATED)
async def create_association(
    s_email: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Token = Depends(get_current_teacher),
):
    return await AuthService.create_association(
        db, t_email=current_user.email, s_email=s_email
    )


@router.get("/me", response_model=dict, status_code=status.HTTP_200_OK)
async def get_current_user_details(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Token = Depends(get_token_data),
):
    """
    Get comprehensive user details including profile info and usage statistics.
    """
    return await AuthService.get_user_details(db, email=current_user.email)


@router.get("/usage", status_code=status.HTTP_200_OK)
async def get_usage(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_teacher: Token = Depends(get_current_teacher),
) -> dict:
    return await AuthService.get_usage(db, email=current_teacher.email)
