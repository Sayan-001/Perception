from decimal import Decimal
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.model import Association, UserUsage
from app.auth.schemas import Token
from app.core.model import UserType
from app.papers.model import Question, QuestionPaper
from app.papers.schemas import QuestionPaperCreate, QuestionPaperUpdate


class PaperService:
    @staticmethod
    async def create_paper(
        paper_in: QuestionPaperCreate, current_teacher: Token, db: AsyncSession
    ) -> QuestionPaper:
        usage_stmt = select(UserUsage).where(UserUsage.email == current_teacher.email)
        usage_res = await db.execute(usage_stmt)
        teacher_usage = usage_res.scalar_one_or_none()

        if teacher_usage and teacher_usage.papers_created_balance_monthly <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Monthly paper creation limit reached.",
            )

        paper_data = paper_in.model_dump(exclude={"questions"})
        total_marks = sum(
            (q.marks_assigned for q in paper_in.questions), start=Decimal("0")
        )
        db_paper = QuestionPaper(
            t_email=current_teacher.email, **paper_data, total_marks=total_marks
        )

        # Add questions
        for q_in in paper_in.questions:
            db_paper.questions.append(Question(**q_in.model_dump()))

        db.add(db_paper)

        if teacher_usage:
            teacher_usage.papers_created_balance_monthly -= 1
            teacher_usage.total_papers_created += 1
            db.add(teacher_usage)

        await db.commit()
        await db.refresh(db_paper)

        # Reload to get questions relationship populated if not fully there
        result = await db.execute(
            select(QuestionPaper)
            .options(selectinload(QuestionPaper.questions))
            .where(QuestionPaper.qpid == db_paper.qpid)
        )
        return result.scalars().first()

    @staticmethod
    async def get_papers(
        skip: int, limit: int, current_token: Token, db: AsyncSession
    ) -> Sequence[QuestionPaper]:
        query = (
            select(QuestionPaper)
            .where(QuestionPaper.t_email == current_token.email)
            .order_by(QuestionPaper.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_paper(
        qpid: int, current_token: Token, db: AsyncSession
    ) -> QuestionPaper:
        query = (
            select(QuestionPaper)
            .options(selectinload(QuestionPaper.questions))
            .where(QuestionPaper.qpid == qpid)
        )
        result = await db.execute(query)
        paper = result.scalars().first()

        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found"
            )

        # Handle student access
        if current_token.role == UserType.student.value:
            if paper.is_published is False:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Paper not yet available",
                )

            association_query = select(Association).where(
                Association.t_email == paper.t_email,
                Association.s_email == current_token.email,
            )
            association_result = await db.execute(association_query)
            if not association_result.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this paper",
                )

        # Handle teacher access
        paper_owner_email = str(getattr(paper, "t_email"))
        if (current_token.role == UserType.teacher.value) and (
            paper_owner_email != current_token.email
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this paper",
            )

        return paper

    @staticmethod
    async def update_paper(
        qpid: int,
        paper_in: QuestionPaperUpdate,
        current_teacher: Token,
        db: AsyncSession,
    ) -> QuestionPaper:
        query = (
            select(QuestionPaper)
            .options(selectinload(QuestionPaper.questions))
            .where(
                QuestionPaper.qpid == qpid,
                QuestionPaper.t_email == current_teacher.email,
            )
        )
        result = await db.execute(query)
        db_paper = result.scalars().first()

        if not db_paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found"
            )

        update_data = paper_in.model_dump(exclude_unset=True, exclude={"questions"})

        # Update paper fields
        for field, value in update_data.items():
            setattr(db_paper, field, value)

        # Update questions if provided
        if paper_in.questions is not None:
            existing_questions_map = {q.qid: q for q in db_paper.questions}

            incoming_qids = {q.qid for q in paper_in.questions if q.qid is not None}

            # Remove questions that are not in the new incoming set
            for old_q in list(db_paper.questions):
                if old_q.qid not in incoming_qids:
                    db_paper.questions.remove(old_q)

            # Add or update questions
            for q_in in paper_in.questions:
                if q_in.qid and q_in.qid in existing_questions_map:
                    # Update existing
                    existing_q = existing_questions_map[q_in.qid]
                    q_data = q_in.model_dump(exclude_unset=True, exclude={"qid"})
                    for k, v in q_data.items():
                        setattr(existing_q, k, v)
                else:
                    # Create new
                    q_data = q_in.model_dump(exclude={"qid"})
                    db_paper.questions.append(Question(**q_data))

        total_marks = sum(
            (q.marks_assigned for q in db_paper.questions), start=Decimal("0")
        )
        db_paper.total_marks = total_marks

        await db.commit()
        await db.refresh(db_paper)

        result = await db.execute(
            select(QuestionPaper)
            .options(selectinload(QuestionPaper.questions))
            .where(QuestionPaper.qpid == db_paper.qpid)
        )
        return result.scalars().first()

    @staticmethod
    async def delete_paper(qpid: int, current_teacher: Token, db: AsyncSession) -> None:
        query = select(QuestionPaper).where(
            QuestionPaper.qpid == qpid,
            QuestionPaper.t_email == current_teacher.email,
        )
        result = await db.execute(query)
        db_paper = result.scalars().first()

        if not db_paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found"
            )

        await db.delete(db_paper)
        await db.commit()
