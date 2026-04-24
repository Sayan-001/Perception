from groq import AsyncGroq
from pydantic import BaseModel, Field

from app.config import settings

SYSTEM_PROMPT = """
### Instructions:
1) You are a descriptive answer evaluator. You must evaluate the student's answers by comparing it to the provided teacher's answers for a question.
2) If student has not provided an answer, you must return a score of 0.
3) You must directly address the student in 2nd person and talk like a teacher when providing feedback. Only highlight the mistakes and do not provide the correct answer.
4) You must follow the evaluation rubric provided.
5) If no rubric is provided, follow this default rubric and decide the total score as the average: clarity (0-10), relevance (0-10), accuracy (0-10), completeness (0-10).

You must return a JSON object with the keys "score" (A number between 0 and maximum marks alloted, both inclusive) and "feedback". 
"""


class EvaluationResponse(BaseModel):
    score: float = Field(
        ge=0.0,
        default=0.0,
        description="The score awarded out of 10 based on the rubric.",
    )
    feedback: str = Field(
        default="",
        description="Feedback to the student highlighting mistakes, without providing the correct answer.",
    )


class EvaluationService:
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    eval_model = "llama-3.3-70b-versatile"

    @classmethod
    async def evaluate(
        cls,
        question: str,
        student_answer: str,
        max_marks: float,
        teacher_answer: str | None = None,
        rubric: str | None = None,
    ) -> tuple[EvaluationResponse, int]:
        to_eval = f"Question: {question}\nTeacher's Answer: {teacher_answer or 'None provided'}\nStudent's Answer: {student_answer}\nEvaluation Rubric: {rubric or 'None provided'} \nMax Marks: {max_marks}"

        completion = await cls.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT.strip(),
                },
                {
                    "role": "user",
                    "content": to_eval.strip(),
                },
            ],
            model=cls.eval_model,
            max_tokens=256,
            response_format={"type": "json_object"},
            temperature=0.4,
        )

        evaluation_response = EvaluationResponse.model_validate_json(
            json_data=completion.choices[0].message.content or ""
        )

        tokens_used = completion.usage.total_tokens if completion.usage else 0

        return evaluation_response, tokens_used
