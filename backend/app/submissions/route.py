from typing import List, Union

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_token_data
from app.auth.schemas import Token
from app.core.model import UserType
from app.submissions.service import SubmissionService
from app.submissions.schemas import (
    SubmissionCreate,
    SubmissionTeacherOut,
    SubmissionStudentOut,
    SubmissionDetailTeacherOut,
    SubmissionDetailStudentOut,
)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


@router.post(
    "/{qpid}",
    response_model=SubmissionDetailStudentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_submission(
    qpid: int,
    submission_in: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Token = Depends(get_token_data),
):
    """
    Submit answers for a particular question paper. Limited to students.
    """
    submission = await SubmissionService.create_submission(
        qpid, submission_in, current_user, db
    )
    return SubmissionDetailStudentOut.model_validate(submission)


@router.get(
    "/{qpid}",
    response_model=Union[List[SubmissionTeacherOut], List[SubmissionStudentOut]],
)
async def list_submissions_for_paper(
    qpid: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Token = Depends(get_token_data),
):
    """
    Retrieve all submissions for a specific question paper.
    If student, retrieves only their own submission.
    """
    submissions = await SubmissionService.get_submissions_for_paper(
        qpid, skip, limit, current_user, db
    )

    if current_user.role == UserType.teacher.value:
        return [SubmissionTeacherOut.model_validate(s) for s in submissions]
    else:
        return [SubmissionStudentOut.model_validate(s) for s in submissions]


@router.get(
    "/{qpid}/{s_email}",
    response_model=Union[SubmissionDetailTeacherOut, SubmissionDetailStudentOut],
)
async def get_submission(
    qpid: int,
    s_email: str,
    db: AsyncSession = Depends(get_db),
    current_user: Token = Depends(get_token_data),
):
    """
    Retrieve a specific submission and its answers.
    Students can only retrieve their own.
    """
    submission = await SubmissionService.get_submission(qpid, s_email, current_user, db)

    if current_user.role == UserType.teacher.value:
        return SubmissionDetailTeacherOut.model_validate(submission)
    else:
        return SubmissionDetailStudentOut.model_validate(submission)


@router.delete("/{qpid}/{s_email}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(
    qpid: int,
    s_email: str,
    db: AsyncSession = Depends(get_db),
    current_user: Token = Depends(get_token_data),
):
    """
    Delete a specific submission.
    Students can delete their own. Teachers can delete any submission on their question paper.
    """
    await SubmissionService.delete_submission(qpid, s_email, current_user, db)
