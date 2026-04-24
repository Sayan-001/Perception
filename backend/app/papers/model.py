from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class QuestionPaper(Base):
    __tablename__ = "question_papers"

    qpid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    t_email: Mapped[str] = mapped_column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    total_marks: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    questions: Mapped[List["Question"]] = relationship(
        "Question", back_populates="paper", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "paper_questions"

    __table_args__ = (
        UniqueConstraint("qpid", "qid", name="uq_paper_questions_qpid_qid"),
    )

    qid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    qpid: Mapped[int] = mapped_column(
        Integer, ForeignKey("question_papers.qpid", ondelete="CASCADE"), nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_answer: Mapped[Optional[str]] = mapped_column(Text)
    rubric: Mapped[Optional[str]] = mapped_column(Text)
    marks_assigned: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # A simple back-reference to the paper
    paper: Mapped["QuestionPaper"] = relationship(
        "QuestionPaper", back_populates="questions"
    )
