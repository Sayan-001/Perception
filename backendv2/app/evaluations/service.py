import asyncio
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import Token
from app.core.model import UserType, EvaluationStatus
from app.submissions.model import Submission, Answer
from app.papers.model import QuestionPaper, Question
from app.utils.evaluator import EvaluationService as LLMEvaluationService


class SubEvaluationService:
    @staticmethod
    async def evaluate_submission(
        qpid: int,
        s_email: str,
        current_teacher: Token,
        db: AsyncSession,
    ) -> Submission:
        if current_teacher.role != UserType.teacher.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only teachers can trigger evaluation.",
            )

        # check paper
        stmt_paper = select(QuestionPaper).where(QuestionPaper.qpid == qpid)
        paper_res = await db.execute(stmt_paper)
        paper = paper_res.scalar_one_or_none()
        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found"
            )

        if paper.t_email != current_teacher.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only evaluate submissions for your own papers.",
            )

        # check submission
        stmt_sub = select(Submission).where(
            Submission.qpid == qpid, Submission.s_email == s_email
        )
        sub_res = await db.execute(stmt_sub)
        submission = sub_res.scalar_one_or_none()
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found"
            )

        # Get questions
        stmt_questions = select(Question).where(Question.qpid == qpid)
        q_res = await db.execute(stmt_questions)
        questions_map = {q.qid: q for q in q_res.scalars().all()}

        # Get answers
        stmt_answers = select(Answer).where(
            Answer.qpid == qpid, Answer.s_email == s_email
        )
        a_res = await db.execute(stmt_answers)
        answers = list(a_res.scalars().all())

        total_marks = Decimal("0.0")

        async def eval_answer(ans: Answer) -> Answer:
            q = questions_map.get(ans.qid)
            if not q:
                return ans

            try:
                eval_res = await LLMEvaluationService.evaluate(
                    question=q.question_text,
                    student_answer=ans.student_answer or "",
                    max_marks=float(q.marks_assigned),
                    teacher_answer=q.model_answer,
                    rubric=q.rubric,
                )

                # The score is directly evaluated against max_marks
                awarded = Decimal(str(eval_res.score))

                ans.marks_obtained = round(awarded, 2)
                ans.feedback = eval_res.feedback
                ans.status = EvaluationStatus.success
            except Exception as _:
                ans.status = EvaluationStatus.failed

            return ans

        # Evaluate answers concurrently using gather
        tasks = [eval_answer(a) for a in answers]
        await asyncio.gather(*tasks)

        for a in answers:
            if a.status == EvaluationStatus.success:
                total_marks += a.marks_obtained
            db.add(a)

        submission.evaluated = True
        submission.total_marks_obtained = total_marks
        db.add(submission)

        await db.commit()
        await db.refresh(submission)

        for a in answers:
            await db.refresh(a)

        # Attach evaluated answers returning the detailed submission out
        submission.answers = answers
        return submission
