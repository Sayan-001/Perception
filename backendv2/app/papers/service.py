from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.model import UserType
from app.papers.model import QuestionPaper, PaperQuestions
from app.questions.model import Question
from app.auth.model import Association
from app.auth.schemas import TokenPayload
from app.papers.schemas import (
    QuestionPaperCreate,
    QuestionPaperUpdate,
    PaperQuestionCreate,
)


class PaperService:
    @staticmethod
    async def create_paper(
        paper_in: QuestionPaperCreate, current_teacher: TokenPayload, db: AsyncSession
    ) -> QuestionPaper:
        db_paper = QuestionPaper(t_email=current_teacher.email, **paper_in.model_dump())
        db.add(db_paper)
        await db.commit()
        await db.refresh(db_paper)
        return db_paper

    @staticmethod
    async def get_papers(
        skip: int, limit: int, current_token: TokenPayload, db: AsyncSession
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
        qpid: int, current_token: TokenPayload, db: AsyncSession
    ) -> QuestionPaper:
        query = select(QuestionPaper).where(QuestionPaper.qpid == qpid)
        result = await db.execute(query)
        paper = result.scalars().first()

        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Question paper not found"
            )

        # Handle student access
        if current_token.role == UserType.student.value:
            # Paper must be published
            if paper.is_published is False:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Paper not yet available",
                )

            # Student must be associated with the teacher who created the paper
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
        if (current_token.role == UserType.teacher.value) and (
            paper.t_email != current_token.email
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this paper",
            )

        return paper

    @staticmethod
    async def get_paper_questions(
        qpid: int, current_token: TokenPayload, db: AsyncSession
    ) -> Sequence[PaperQuestions]:
        # Validate paper exists and is accessible
        await PaperService.get_paper(qpid, current_token, db)

        query = (
            select(PaperQuestions)
            .where(PaperQuestions.qpid == qpid)
            .options(selectinload(PaperQuestions.question))
            .order_by(PaperQuestions.sort_order)
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_paper(
        qpid: int,
        paper_in: QuestionPaperUpdate,
        current_teacher: TokenPayload,
        db: AsyncSession,
    ) -> QuestionPaper:
        query = select(QuestionPaper).where(
            QuestionPaper.qpid == qpid, QuestionPaper.t_email == current_teacher.email
        )
        result = await db.execute(query)
        db_paper = result.scalars().first()

        if not db_paper:
            raise HTTPException(status_code=404, detail="Question paper not found")

        update_data = paper_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_paper, field, value)

        await db.commit()
        await db.refresh(db_paper)
        return db_paper

    @staticmethod
    async def assign_question_to_paper(
        qpid: int,
        mapping_in: PaperQuestionCreate,
        current_teacher: TokenPayload,
        db: AsyncSession,
    ) -> PaperQuestions:
        paper_query = select(QuestionPaper).where(
            QuestionPaper.qpid == qpid, QuestionPaper.t_email == current_teacher.email
        )
        paper_res = await db.execute(paper_query)
        if not paper_res.scalars().first():
            raise HTTPException(status_code=404, detail="Question paper not found")

        question_query = select(Question).where(Question.qid == mapping_in.qid)
        question_res = await db.execute(question_query)
        if not question_res.scalars().first():
            raise HTTPException(status_code=404, detail="Question not found")

        db_mapping = PaperQuestions(
            qpid=qpid,
            qid=mapping_in.qid,
            sort_order=mapping_in.sort_order,
            marks_assigned=mapping_in.marks_assigned,
        )
        db.add(db_mapping)
        await db.commit()
        await db.refresh(db_mapping)
        return db_mapping
