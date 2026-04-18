from groq import AsyncGroq

from app.config import settings
from app.evaluations.schemas import EvaluationResponse

SYSTEM_PROMPT = """
### Instructions:
1) You are a descriptive answer evaluator. You must evaluate the student's answers by comparing it to the provided teacher's answers for a question.
2) If student has not provided an answer, you must return a score of 0.
3) You must directly address the student in 2nd person and talk like a teacher when providing feedback. Only highlight the mistakes and do not provide the correct answer.
4) You must follow the evaluation rubric provided.
5) If no rubric is provided, follow this default rubric and decide the total score as the average: clarity (0-10), relevance (0-10), accuracy (0-10), completeness (0-10).

You must return a JSON object with the keys "score" (A number between 0 and 10, both inclusive) and "feedback". 
"""


class EvaluationService:
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    eval_model = "llama-3.3-70b-versatile"

    @classmethod
    async def evaluate(
        cls,
        question: str,
        teacher_answer: str,
        student_answer: str,
        rubric: str,
    ) -> EvaluationResponse:
        to_eval = f"Question: {question}\nTeacher's Answer: {teacher_answer}\nStudent's Answer: {student_answer}\nEvaluation Rubric: {rubric}"

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

        return evaluation_response
