from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_teacher
from app.auth.schemas import TokenPayload
from app.questions.model import Question
from app.questions.schemas import QuestionCreate, QuestionTeacherOut

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post(
    "/", response_model=QuestionTeacherOut, status_code=status.HTTP_201_CREATED
)
async def create_question(
    question_in: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: TokenPayload = Depends(get_current_teacher),
):
    """
    Create a new standalone question in the question bank. Limited to teachers.
    """
    db_question = Question(**question_in.model_dump())
    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)
    return db_question
