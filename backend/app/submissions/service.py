from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import Token
from app.core.model import UserType
from app.submissions.model import Answer, Submission
from app.submissions.schemas import SubmissionCreate
from app.papers.model import QuestionPaper


from app.auth.model import UserUsage


class SubmissionService:
    @staticmethod
    async def create_submission(
        qpid: int,
        submission_in: SubmissionCreate,
        current_user: Token,
        db: AsyncSession,
    ) -> Submission:
        if current_user.role != UserType.student.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can submit answers.",
            )

        # Get student usage
        usage_stmt = select(UserUsage).where(UserUsage.email == current_user.email)
        usage_res = await db.execute(usage_stmt)
        student_usage = usage_res.scalar_one_or_none()

        if student_usage and student_usage.submissions_made_balance_monthly <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Monthly submission limit reached.",
            )

        # Check if question paper exists
        stmt_paper = select(QuestionPaper).where(QuestionPaper.qpid == qpid)
        paper_res = await db.execute(stmt_paper)
        paper = paper_res.scalar_one_or_none()

        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question paper not found.",
            )

        # Check if submission already exists
        stmt_sub = select(Submission).where(
            Submission.qpid == qpid, Submission.s_email == current_user.email
        )
        sub_res = await db.execute(stmt_sub)
        if sub_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Submission already exists for this question paper.",
            )

        submission = Submission(
            qpid=qpid,
            s_email=current_user.email,
            evaluated=False,
            total_marks_obtained=0.0,
        )
        db.add(submission)
        await db.flush()

        # Add answers
        final_answers = []
        for ans in submission_in.answers:
            answer_record = Answer(
                qpid=qpid,
                s_email=current_user.email,
                qid=ans.qid,
                student_answer=ans.student_answer,
            )
            db.add(answer_record)
            final_answers.append(answer_record)

        if student_usage:
            student_usage.submissions_made_balance_monthly -= 1
            student_usage.total_submissions_made += 1
            db.add(student_usage)

        await db.commit()
        await db.refresh(submission)

        # Attach answers for returning
        submission.answers = final_answers

        return submission

    @staticmethod
    async def get_submissions_for_paper(
        qpid: int,
        skip: int,
        limit: int,
        current_user: Token,
        db: AsyncSession,
    ) -> List[Submission]:
        stmt = select(Submission).where(Submission.qpid == qpid)

        # If student, only show their own submissions
        if current_user.role == UserType.student.value:
            stmt = stmt.where(Submission.s_email == current_user.email)

        stmt = stmt.offset(skip).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_submission(
        qpid: int,
        s_email: str,
        current_user: Token,
        db: AsyncSession,
    ) -> Submission:
        if (
            current_user.role == UserType.student.value
            and current_user.email != s_email
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this submission.",
            )

        stmt = select(Submission).where(
            Submission.qpid == qpid, Submission.s_email == s_email
        )
        res = await db.execute(stmt)
        submission = res.scalar_one_or_none()

        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found.",
            )

        stmt_answers = select(Answer).where(
            Answer.qpid == qpid, Answer.s_email == s_email
        )
        answers_res = await db.execute(stmt_answers)
        submission.answers = list(answers_res.scalars().all())

        return submission

    @staticmethod
    async def delete_submission(
        qpid: int,
        s_email: str,
        current_user: Token,
        db: AsyncSession,
    ) -> None:
        if (
            current_user.role == UserType.student.value
            and current_user.email != s_email
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this submission.",
            )

        stmt = select(Submission).where(
            Submission.qpid == qpid, Submission.s_email == s_email
        )
        res = await db.execute(stmt)
        submission = res.scalar_one_or_none()

        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found.",
            )

        if current_user.role == UserType.teacher.value:
            stmt_paper = select(QuestionPaper).where(QuestionPaper.qpid == qpid)
            paper_res = await db.execute(stmt_paper)
            paper = paper_res.scalar_one_or_none()
            if not paper or paper.t_email != current_user.email:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this submission.",
                )

        await db.delete(submission)
        await db.commit()
