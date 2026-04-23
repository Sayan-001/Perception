import time

import pytest

from app.utils.evaluator import EvaluationService, EvaluationResponse
from app.utils.logging import logger


@pytest.mark.asyncio
async def test_evaluate_real_request():
    question = "What is the capital of Japan?"
    teacher_answer = "Tokyo"
    student_answer = "tokyo"
    rubric = ""

    _ = time.process_time()
    real_start_time = time.time()

    result = await EvaluationService.evaluate(
        question=question,
        student_answer=student_answer,
        max_marks=10.0,
        teacher_answer=teacher_answer,
        rubric=rubric,
    )

    latency = time.time() - real_start_time

    assert isinstance(result, EvaluationResponse)
    assert 0.0 <= result.score <= 10.0
    assert isinstance(result.feedback, str)
    assert len(result.feedback) > 0

    logger.info(
        "Real Request Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )


@pytest.mark.asyncio
async def test_evaluate_real_request_poor_answer():
    start_time = time.time()
    result = await EvaluationService.evaluate(
        question="Explain the theory of relativity.",
        student_answer="I don't know, an apple fell on his head?",
        max_marks=10.0,
        teacher_answer="E=mc^2 and the laws of physics are the same for all non-accelerating observers.",
        rubric="Provide structural feedback and score strictly.",
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert result.score < 5.0

    logger.info(
        "Poor Answer Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )
