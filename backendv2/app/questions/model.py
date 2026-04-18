from sqlalchemy import Column, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    qid = Column(Integer, primary_key=True, autoincrement=True)
    tags = Column(JSONB)
    question_text = Column(Text, nullable=False)
    model_answer = Column(Text)
    rubric = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    paper_questions = relationship(
        "PaperQuestions", back_populates="question", cascade="all, delete-orphan"
    )
