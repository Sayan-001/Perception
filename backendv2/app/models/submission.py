from sqlalchemy import Boolean, Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, ForeignKeyConstraint, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import EvaluationStatus


class Submission(Base):
    __tablename__ = "submissions"

    qpid = Column(
        Integer,
        ForeignKey("question_papers.qpid", ondelete="CASCADE"),
        primary_key=True,
    )
    s_email = Column(
        String, ForeignKey("app_users.email", ondelete="CASCADE"), primary_key=True
    )
    evaluated = Column(Boolean, default=False)
    total_marks_obtained = Column(Numeric(10, 2), default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Answer(Base):
    __tablename__ = "answers"

    qpid = Column(Integer, primary_key=True)
    s_email = Column(String, primary_key=True)
    qid = Column(Integer, primary_key=True)

    student_answer = Column(Text)
    marks_obtained = Column(Numeric(10, 2), default=0.0)
    feedback = Column(Text)
    raw_llm_data = Column(JSONB)
    status = Column(SQLEnum(EvaluationStatus), default=EvaluationStatus.pending)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
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
