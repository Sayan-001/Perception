from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.model import AppUser, UserUsage
from app.auth.schemas import UserCreate
from app.config import settings


class AuthService:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    ALGORITHM = "HS256"

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        return cls.pwd_context.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password: str) -> str:
        return cls.pwd_context.hash(password)

    @classmethod
    def create_access_token(cls, email: str, role: str) -> str:
        expire_delay = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {"exp": expire_delay, "email": email, "role": role}
        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=cls.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> AppUser | None:
        result = await db.execute(select(AppUser).where(AppUser.email == email))
        return result.scalar_one_or_none()

    @classmethod
    async def create_user(cls, db: AsyncSession, user_input: UserCreate) -> AppUser:
        new_user = AppUser(
            email=user_input.email,
            password_hash=cls.get_password_hash(user_input.password),
            full_name=user_input.full_name,
            user_type=user_input.user_type,
        )

        new_usage = UserUsage(email=user_input.email)

        db.add(new_user)
        db.add(new_usage)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @classmethod
    async def authenticate_user(
        cls, db: AsyncSession, email: str, password: str
    ) -> AppUser | None:
        user = await cls.get_user_by_email(db, email)
        if not user:
            return None
        if not cls.verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, email: str) -> None:
        from fastapi import HTTPException, status

        user = await AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        await db.delete(user)
        await db.commit()
