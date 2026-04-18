from datetime import date

from sqlalchemy import Boolean, Column, Date, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.config import settings
from app.database import Base
from app.core.model import UserType


class AppUser(Base):
    __tablename__ = "app_users"

    email = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    user_type = Column(SQLEnum(UserType), nullable=False)

    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UserUsage(Base):
    __tablename__ = "user_usage"

    email = Column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), primary_key=True
    )

    total_papers_created = Column(Integer, default=0)
    total_submissions_made = Column(Integer, default=0)
    total_llm_tokens_used = Column(Integer, default=0)

    papers_created_balance_monthly = Column(
        Integer, default=settings.PAPERS_CREATED_MONTHLY_LIMIT
    )
    submissions_made_balance_monthly = Column(
        Integer, default=settings.SUBMISSIONS_MADE_MONTHLY_LIMIT
    )
    llm_tokens_balance_monthly = Column(
        Integer, default=settings.LLM_TOKEN_BALANCE_MONTHLY_LIMIT
    )

    last_reset_date = Column(Date, default=date.today)

    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Association(Base):
    __tablename__ = "associations"

    t_email = Column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), primary_key=True
    )
    s_email = Column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), primary_key=True
    )
