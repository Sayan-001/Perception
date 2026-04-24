from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, ForeignKeyConstraint, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.model import EvaluationStatus
from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    qpid: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("question_papers.qpid", ondelete="CASCADE"),
        primary_key=True,
    )
    s_email: Mapped[str] = mapped_column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), primary_key=True
    )

    evaluated: Mapped[bool] = mapped_column(Boolean, default=False)
    total_marks_obtained: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Answer(Base):
    __tablename__ = "answers"

    qpid: Mapped[int] = mapped_column(Integer, primary_key=True)
    s_email: Mapped[str] = mapped_column(String, primary_key=True)
    qid: Mapped[int] = mapped_column(Integer, primary_key=True)

    student_answer: Mapped[Optional[str]] = mapped_column(Text)
    marks_obtained: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0)
    feedback: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[EvaluationStatus] = mapped_column(
        SQLEnum(EvaluationStatus), default=EvaluationStatus.pending
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["qpid", "s_email"],
            ["submissions.qpid", "submissions.s_email"],
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["qpid", "qid"],
            ["paper_questions.qpid", "paper_questions.qid"],
            ondelete="CASCADE",
        ),
    )
