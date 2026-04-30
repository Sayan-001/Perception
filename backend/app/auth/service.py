from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.model import AppUser, Association, UserUsage
from app.auth.schemas import UserCreate
from app.config import settings
from app.core.model import UserType


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

        user = await AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        await db.delete(user)
        await db.commit()

    @staticmethod
    async def get_associations(db: AsyncSession, email: str, role: str) -> dict:
        result = None

        if role == UserType.teacher.value:
            result = await db.execute(
                select(AppUser).where(
                    AppUser.email.in_(
                        select(Association.s_email).where(Association.t_email == email)
                    )
                )
            )
        elif role == UserType.student.value:
            result = await db.execute(
                select(AppUser).where(
                    AppUser.email.in_(
                        select(Association.t_email).where(Association.s_email == email)
                    )
                )
            )

        if result is None:
            return {"associations": []}

        users = result.scalars().all()
        associations_data = []
        for user in users:
            associations_data.append(
                {
                    "email": user.email,
                    "full_name": user.full_name,
                    "user_type": user.user_type.value
                    if hasattr(user.user_type, "value")
                    else str(user.user_type),
                    "is_verified": user.is_verified,
                }
            )
        return {"associations": associations_data}

    @staticmethod
    async def create_association(db: AsyncSession, t_email: str, s_email: str) -> dict:
        teacher = await AuthService.get_user_by_email(db, t_email)
        student = await AuthService.get_user_by_email(db, s_email)

        if not teacher or teacher.user_type != UserType.teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )
        if not student or student.user_type != UserType.student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
            )

        association = Association(t_email=t_email, s_email=s_email)
        db.add(association)
        await db.commit()
        await db.refresh(association)

        return {
            "teacher": {
                "email": teacher.email,
                "full_name": teacher.full_name,
                "user_type": teacher.user_type.value
                if hasattr(teacher.user_type, "value")
                else str(teacher.user_type),
            },
            "student": {
                "email": student.email,
                "full_name": student.full_name,
                "user_type": student.user_type.value
                if hasattr(student.user_type, "value")
                else str(student.user_type),
            },
        }

    @staticmethod
    async def get_usage(db: AsyncSession, email: str) -> dict:
        result = await db.execute(select(UserUsage).where(UserUsage.email == email))
        usage = result.scalar_one_or_none()
        if not usage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User usage not found"
            )
        return {
            "email": usage.email,
            "papers_created_balance": usage.papers_created_balance_monthly,
            "llm_tokens_balance": usage.llm_tokens_balance_monthly,
        }

    @staticmethod
    async def get_user_details(db: AsyncSession, email: str) -> dict:
        """
        Get comprehensive user details including profile, usage, and statistics.
        """
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Get usage stats
        usage_result = await db.execute(
            select(UserUsage).where(UserUsage.email == email)
        )
        usage = usage_result.scalar_one_or_none()

        # Get association counts
        if user.user_type == UserType.teacher:
            # Count students associated with this teacher
            assoc_result = await db.execute(
                select(Association).where(Association.t_email == email)
            )
            association_count = len(assoc_result.scalars().all())
        else:
            # Count teachers associated with this student
            assoc_result = await db.execute(
                select(Association).where(Association.s_email == email)
            )
            association_count = len(assoc_result.scalars().all())

        return {
            "profile": {
                "email": user.email,
                "full_name": user.full_name,
                "user_type": user.user_type.value
                if hasattr(user.user_type, "value")
                else str(user.user_type),
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            },
            "usage": {
                "total_papers_created": usage.total_papers_created if usage else 0,
                "total_submissions_made": usage.total_submissions_made if usage else 0,
                "total_llm_tokens_used": usage.total_llm_tokens_used if usage else 0,
                "papers_created_balance_monthly": usage.papers_created_balance_monthly
                if usage
                else 0,
                "submissions_made_balance_monthly": usage.submissions_made_balance_monthly
                if usage
                else 0,
                "llm_tokens_balance_monthly": usage.llm_tokens_balance_monthly
                if usage
                else 0,
                "last_reset_date": usage.last_reset_date.isoformat() if usage else None,
            },
            "statistics": {"association_count": association_count},
        }
