from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import jwt
from passlib.context import CryptContext

from app.config import settings
from app.models.user import AppUser, UserUsage
from app.schemas.auth import UserCreate


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
    def create_access_token(
        cls, subject: str, expires_delta: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    ) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
        to_encode = {"exp": expire, "sub": str(subject)}
        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=cls.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> AppUser | None:
        result = await db.execute(select(AppUser).where(AppUser.email == email))
        return result.scalar_one_or_none()

    @classmethod
    async def create_user(cls, db: AsyncSession, user_in: UserCreate) -> AppUser:
        new_user = AppUser(
            email=user_in.email,
            password_hash=cls.get_password_hash(user_in.password),
            full_name=user_in.full_name,
            user_type=user_in.user_type,
        )

        new_usage = UserUsage(email=user_in.email)

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
