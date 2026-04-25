import asyncio
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.model import UserUsage
from app.auth.schemas import Token
from app.core.model import EvaluationStatus, UserType
from app.papers.model import Question, QuestionPaper
from app.submissions.model import Answer, Submission
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

        usage_res = await db.execute(
            select(UserUsage).where(UserUsage.email == current_teacher.email)
        )
        teacher_usage = usage_res.scalar_one_or_none()

        if teacher_usage and teacher_usage.llm_tokens_balance_monthly <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Monthly LLM token limit reached.",
            )

        paper_res = await db.execute(
            select(QuestionPaper).where(QuestionPaper.qpid == qpid)
        )
        paper = paper_res.scalar_one_or_none()
        if paper is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found"
            )

        if paper.t_email != current_teacher.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only evaluate submissions for your own papers.",
            )

        sub_res = await db.execute(
            select(Submission).where(
                Submission.qpid == qpid, Submission.s_email == s_email
            )
        )
        submission = sub_res.scalar_one_or_none()
        if submission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found"
            )

        q_res = await db.execute(select(Question).where(Question.qpid == qpid))
        questions_map = {q.qid: q for q in q_res.scalars().all()}

        a_res = await db.execute(
            select(Answer).where(Answer.qpid == qpid, Answer.s_email == s_email)
        )
        answers = list(a_res.scalars().all())

        total_marks = Decimal("0.0")
        total_tokens_used = 0

        async def eval_answer(ans: Answer) -> Answer:
            nonlocal total_tokens_used
            q = questions_map.get(ans.qid)
            if not q:
                return ans

            try:
                eval_res, tokens = await LLMEvaluationService.evaluate(
                    question=q.question_text,
                    student_answer=ans.student_answer or "",
                    max_marks=float(q.marks_assigned),
                    teacher_answer=q.model_answer,
                    rubric=q.rubric,
                )

                total_tokens_used += tokens
                awarded = Decimal(str(eval_res.score))

                ans.marks_obtained = round(awarded, 2)
                ans.feedback = eval_res.feedback
                ans.status = EvaluationStatus.success
            except Exception as _:
                ans.status = EvaluationStatus.failed

            return ans

        tasks = [eval_answer(a) for a in answers]
        await asyncio.gather(*tasks)

        for a in answers:
            if a.status == EvaluationStatus.success:
                total_marks += a.marks_obtained
            db.add(a)

        submission.evaluated = True
        submission.total_marks_obtained = total_marks
        db.add(submission)

        if teacher_usage:
            teacher_usage.llm_tokens_balance_monthly -= total_tokens_used
            teacher_usage.total_llm_tokens_used += total_tokens_used
            db.add(teacher_usage)

        await db.commit()
        await db.refresh(submission)

        for a in answers:
            await db.refresh(a)

        submission.answers = answers
        return submission
