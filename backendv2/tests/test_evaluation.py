import pytest
import time
from app.schemas.evaluation import EvaluationResponse
from app.services.evaluation_service import EvaluationService


@pytest.mark.asyncio
async def test_evaluate_real_request():
    service = EvaluationService()

    question = "What is the capital of Japan?"
    teacher_answer = "Tokyo"
    student_answer = "tokyo"
    rubric = ""

    start_time = time.process_time()
    real_start_time = time.time()

    result = await service.evaluate(
        question=question,
        teacher_answer=teacher_answer,
        student_answer=student_answer,
        rubric=rubric,
    )

    latency = time.time() - real_start_time

    # Assert structure and typical bounds
    assert isinstance(result, EvaluationResponse)
    assert 0.0 <= result.score <= 10.0
    assert isinstance(result.feedback, str)
    assert len(result.feedback) > 0

    # Log metrics to stdout (run pytest with -s to see this output)
    print("\nReal Request Metrics:- ")
    print(f"Latency: {latency:.4f} seconds")
    print(f"Score: {result.score}")
    print(f"Feedback: {result.feedback}")


@pytest.mark.asyncio
async def test_evaluate_real_request_poor_answer():
    service = EvaluationService()

    start_time = time.time()
    result = await service.evaluate(
        question="Explain the theory of relativity.",
        teacher_answer="E=mc^2 and the laws of physics are the same for all non-accelerating observers.",
        student_answer="I don't know, an apple fell on his head?",
        rubric="Provide structural feedback and score strictly.",
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert result.score < 5.0  # Should be scored poorly

    print("\nPoor Answer Metrics:- ")
    print(f"Latency: {latency:.4f} seconds")
    print(f"Score: {result.score}")
    print(f"Feedback: {result.feedback}")
