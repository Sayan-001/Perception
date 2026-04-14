from sqlalchemy import Boolean, Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import UserType


class AppUser(Base):
    __tablename__ = "app_users"

    email = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    user_type = Column(SQLEnum(UserType), nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
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
