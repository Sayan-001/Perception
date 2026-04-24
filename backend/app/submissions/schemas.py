from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.core.model import EvaluationStatus


class AnswerCreate(BaseModel):
    qid: int
    student_answer: str


class SubmissionCreate(BaseModel):
    answers: List[AnswerCreate] = Field(default_factory=list)


# Central Base Models
class AnswerBase(BaseModel):
    qpid: int
    s_email: str
    qid: int
    student_answer: Optional[str] = None
    marks_obtained: Decimal = Decimal("0.0")
    feedback: Optional[str] = None
    status: EvaluationStatus = EvaluationStatus.pending
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SubmissionBase(BaseModel):
    qpid: int
    s_email: str
    evaluated: bool = False
    total_marks_obtained: Decimal = Decimal("0.0")
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Teacher Schemas
class AnswerTeacherOut(AnswerBase):
    pass


class SubmissionTeacherOut(SubmissionBase):
    pass


class SubmissionDetailTeacherOut(SubmissionTeacherOut):
    answers: List[AnswerTeacherOut] = Field(default_factory=list)


# Student Schemas
class AnswerStudentOut(AnswerBase):
    pass


class SubmissionStudentOut(SubmissionBase):
    pass


class SubmissionDetailStudentOut(SubmissionStudentOut):
    answers: List[AnswerStudentOut] = Field(default_factory=list)
