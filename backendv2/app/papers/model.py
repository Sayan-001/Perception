from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class QuestionPaper(Base):
    __tablename__ = "question_papers"

    qpid = Column(Integer, primary_key=True, autoincrement=True)
    t_email = Column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), nullable=False
    )
    title = Column(String, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer)
    total_marks = Column(Numeric(10, 2), nullable=False)
    is_published = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    paper_questions = relationship(
        "PaperQuestions", back_populates="paper", cascade="all, delete-orphan"
    )


class PaperQuestions(Base):
    __tablename__ = "paper_questions"

    qpid = Column(
        Integer,
        ForeignKey("question_papers.qpid", ondelete="CASCADE"),
        primary_key=True,
    )
    qid = Column(
        Integer, ForeignKey("questions.qid", ondelete="CASCADE"), primary_key=True
    )
    sort_order = Column(Integer, nullable=False)
    marks_assigned = Column(Numeric(10, 2), nullable=False)

    paper = relationship("QuestionPaper", back_populates="paper_questions")
    question = relationship("Question", back_populates="paper_questions")
