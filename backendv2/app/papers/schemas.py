from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class QuestionCreate(BaseModel):
    question_text: str
    model_answer: str | None = None
    rubric: str | None = None
    marks_assigned: Decimal
    sort_order: int = 0


class QuestionUpdate(BaseModel):
    qid: int | None = None
    question_text: str | None = None
    model_answer: str | None = None
    rubric: str | None = None
    marks_assigned: Decimal | None = None
    sort_order: int | None = None


# Question Base & Derived Schemas
class QuestionBase(BaseModel):
    qid: int
    qpid: int
    question_text: str
    marks_assigned: Decimal
    sort_order: int

    model_config = {"from_attributes": True}


class QuestionTeacherOut(QuestionBase):
    model_answer: str | None = None
    rubric: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class QuestionStudentOut(QuestionBase):
    pass


class QuestionPaperCreate(BaseModel):
    title: str
    start_date: datetime
    duration_minutes: int | None = None
    is_published: bool = False
    questions: list[QuestionCreate] = Field(default_factory=list)


class QuestionPaperUpdate(BaseModel):
    title: str | None = None
    start_date: datetime | None = None
    duration_minutes: int | None = None
    is_published: bool | None = None
    questions: list[QuestionUpdate] | None = None


# Paper Base & Derived Schemas
class QuestionPaperBase(BaseModel):
    qpid: int
    t_email: str
    title: str
    start_date: datetime
    duration_minutes: int | None = None
    total_marks: Decimal
    is_published: bool

    model_config = {"from_attributes": True}


class QuestionPaperTeacherOut(QuestionPaperBase):
    created_at: datetime
    updated_at: datetime | None = None
    questions: list[QuestionTeacherOut] = Field(default_factory=list)


class QuestionPaperStudentOut(QuestionPaperBase):
    questions: list[QuestionStudentOut] = Field(default_factory=list)


# Minimal Base List Output
class QuestionPaperOut(QuestionPaperBase):
    created_at: datetime
    updated_at: datetime | None = None
