from typing import List, Union
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_teacher, get_token_data
from app.auth.schemas import Token
from app.core.model import UserType
from app.papers.service import PaperService
from app.papers.schemas import (
    QuestionPaperCreate,
    QuestionPaperOut,
    QuestionPaperTeacherOut,
    QuestionPaperStudentOut,
    QuestionPaperUpdate,
)

router = APIRouter(prefix="/api/papers", tags=["papers"])


@router.post(
    "/", response_model=QuestionPaperTeacherOut, status_code=status.HTTP_201_CREATED
)
async def create_paper(
    paper_in: QuestionPaperCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Token = Depends(get_current_teacher),
):
    """
    Create a new question paper along with questions. Limited to teachers.
    """
    paper = await PaperService.create_paper(paper_in, current_teacher, db)
    return QuestionPaperTeacherOut.model_validate(paper)


@router.get("/", response_model=List[QuestionPaperOut])
async def list_papers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Token = Depends(get_token_data),
):
    """
    Retrieve all question papers created by the current user. (List view does not include questions)
    """
    papers = await PaperService.get_papers(skip, limit, current_user, db)
    return [QuestionPaperOut.model_validate(p) for p in papers]


@router.get(
    "/{qpid}", response_model=Union[QuestionPaperTeacherOut, QuestionPaperStudentOut]
)
async def get_paper(
    qpid: int,
    db: AsyncSession = Depends(get_db),
    current_user: Token = Depends(get_token_data),
):
    """
    Retrieve a specific question paper by ID, including its associated questions.
    Returns TeacherOut or StudentOut depending on caller's role.
    """
    paper = await PaperService.get_paper(qpid, current_user, db)

    if current_user.role == UserType.teacher.value:
        return QuestionPaperTeacherOut.model_validate(paper)
    else:
        return QuestionPaperStudentOut.model_validate(paper)


@router.patch("/{qpid}", response_model=QuestionPaperTeacherOut)
async def update_paper(
    qpid: int,
    paper_in: QuestionPaperUpdate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Token = Depends(get_current_teacher),
):
    """
    Update a question paper and its questions. Limited to teachers.
    """
    paper = await PaperService.update_paper(qpid, paper_in, current_teacher, db)
    return QuestionPaperTeacherOut.model_validate(paper)
