from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class QuestionCreate(BaseModel):
    tags: Optional[List[str]] = None
    question_text: str
    model_answer: Optional[str] = None
    rubric: Optional[str] = None


class QuestionUpdate(BaseModel):
    tags: Optional[List[str]] = None
    question_text: Optional[str] = None
    model_answer: Optional[str] = None
    rubric: Optional[str] = None


class QuestionTeacherOut(BaseModel):
    qid: int
    tags: Optional[List[str]] = None
    question_text: str
    model_answer: Optional[str] = None
    rubric: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class QuestionStudentOut(BaseModel):
    qid: int
    tags: Optional[List[str]] = None
    question_text: str

    model_config = {"from_attributes": True}
