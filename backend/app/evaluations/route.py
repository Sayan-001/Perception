from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_teacher
from app.auth.schemas import Token
from app.submissions.schemas import SubmissionDetailTeacherOut
from app.evaluations.service import SubEvaluationService

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


@router.post(
    "/{qpid}/{s_email}",
    response_model=SubmissionDetailTeacherOut,
    status_code=status.HTTP_200_OK,
)
async def evaluate_submission(
    qpid: int,
    s_email: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Token = Depends(get_current_teacher),
):
    """
    Evaluate a specific student's submission for a question paper using the AI Evaluator.
    Limited to the teacher who created the question paper.
    """
    submission = await SubEvaluationService.evaluate_submission(
        qpid, s_email, current_teacher, db
    )
    return SubmissionDetailTeacherOut.model_validate(submission)
