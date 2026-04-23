import jwt
from app.auth.model import AppUser
from app.auth.schemas import Token
from app.config import settings
from app.core.model import UserType
from app.database import get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_token_data(
    token: str = Depends(reusable_oauth2),
) -> Token:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = Token(**payload)
        if token_data.email is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
        return token_data
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token_data: Token = Depends(get_token_data),
) -> AppUser:
    result = await db.execute(select(AppUser).filter(AppUser.email == token_data.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user


async def get_current_teacher(
    token_data: Token = Depends(get_token_data),
) -> Token:
    if token_data.role != UserType.teacher.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher privileges required",
        )
    return token_data
