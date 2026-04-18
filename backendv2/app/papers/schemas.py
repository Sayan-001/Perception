from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

"""
Models for QuestionPaper:
- QuestionPaperCreate: For creating a new question paper.
- QuestionPaperUpdate: For updating an existing question paper.
- QuestionPaperOut: For returning question paper details to teachers (includes all fields).
- QuestionPaperStudentOut: For returning question paper details to students (excludes certain fields).
"""


class QuestionPaperCreate(BaseModel):
    title: str
    start_date: datetime
    duration_minutes: Optional[int] = None
    total_marks: Decimal
    is_published: bool = False


class QuestionPaperUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[Decimal] = None
    is_published: Optional[bool] = None


class QuestionPaperOut(BaseModel):
    qpid: int
    t_email: str
    title: str
    start_date: datetime
    duration_minutes: Optional[int] = None
    total_marks: Decimal
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class QuestionPaperStudentOut(BaseModel):
    qpid: int
    t_email: str
    title: str
    start_date: datetime
    duration_minutes: Optional[int] = None
    total_marks: Decimal
    model_config = {"from_attributes": True}


"""
Models for PaperToQuestion association:
- PaperQuestionCreate: For adding a question to a paper.
- PaperQuestionUpdate: For updating the association.
- PaperQuestionOut: For returning the association details (used internally).
- PaperQuestionDetailOut: Teacher view of the question mapping.
- PaperQuestionStudentOut: Student view of the question mapping.
"""


class PaperQuestionCreate(BaseModel):
    qpid: int
    qid: int
    sort_order: int
    marks_assigned: Decimal


class PaperQuestionUpdate(BaseModel):
    sort_order: Optional[int] = None
    marks_assigned: Optional[Decimal] = None


class PaperQuestionOut(BaseModel):
    qpid: int
    qid: int
    sort_order: int
    marks_assigned: Decimal
    model_config = {"from_attributes": True}


from app.questions.schemas import QuestionTeacherOut, QuestionStudentOut


class PaperQuestionDetailOut(BaseModel):
    qpid: int
    qid: int
    sort_order: int
    marks_assigned: Decimal
    question: QuestionTeacherOut
    model_config = {"from_attributes": True}


class PaperQuestionStudentOut(BaseModel):
    qpid: int
    qid: int
    sort_order: int
    marks_assigned: Decimal
    question: QuestionStudentOut
    model_config = {"from_attributes": True}
