from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Union

from app.database import get_db
from app.auth.dependencies import get_current_teacher, get_token_data
from app.auth.schemas import Token
from app.core.model import UserType
from app.papers.service import PaperService
from app.papers.schemas import (
    QuestionPaperCreate,
    QuestionPaperOut,
    QuestionPaperUpdate,
    PaperQuestionCreate,
    PaperQuestionOut,
    PaperQuestionDetailOut,
    PaperQuestionStudentOut,
)

router = APIRouter(prefix="/papers", tags=["papers"])


@router.post("/", response_model=QuestionPaperOut, status_code=status.HTTP_201_CREATED)
async def create_paper(
    paper_in: QuestionPaperCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Token = Depends(get_current_teacher),
):
    """
    Create a new question paper. Limited to teachers.
    """
    return await PaperService.create_paper(paper_in, current_teacher, db)


@router.get("/", response_model=List[QuestionPaperOut])
async def list_papers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_token: Token = Depends(get_token_data),
):
    """
    Retrieve all question papers created by the current user.
    """
    return await PaperService.get_papers(skip, limit, current_token, db)


@router.get("/{qpid}", response_model=QuestionPaperOut)
async def get_paper(
    qpid: int,
    db: AsyncSession = Depends(get_db),
    current_token: Token = Depends(get_token_data),
):
    """
    Retrieve a specific question paper by ID.
    Available to anyone who needs to view it.
    """
    return await PaperService.get_paper(qpid, current_token, db)


@router.get(
    "/{qpid}/questions/",
    response_model=List[Union[PaperQuestionDetailOut, PaperQuestionStudentOut]],
)
async def get_paper_questions(
    qpid: int,
    db: AsyncSession = Depends(get_db),
    current_token: Token = Depends(get_token_data),
):
    """
    Retrieve all questions assigned to a specific paper. Returns different view models
    based on the user's role.
    """
    questions = await PaperService.get_paper_questions(qpid, current_token, db)

    if current_token.role == UserType.teacher:
        return [PaperQuestionDetailOut.model_validate(q) for q in questions]
    else:
        return [PaperQuestionStudentOut.model_validate(q) for q in questions]


@router.patch("/{qpid}", response_model=QuestionPaperOut)
async def update_paper(
    qpid: int,
    paper_in: QuestionPaperUpdate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Token = Depends(get_current_teacher),
):
    """
    Update a question paper. Limited to teachers.
    """
    return await PaperService.update_paper(qpid, paper_in, current_teacher, db)


@router.post(
    "/{qpid}/questions/",
    response_model=PaperQuestionOut,
    status_code=status.HTTP_201_CREATED,
)
async def assign_question_to_paper(
    qpid: int,
    mapping_in: PaperQuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Token = Depends(get_current_teacher),
):
    """
    Map an existing question to a paper with marks and sort order.
    """
    return await PaperService.assign_question_to_paper(
        qpid, mapping_in, current_teacher, db
    )
