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

    result, tokens = await EvaluationService.evaluate(
        question=question,
        student_answer=student_answer,
        max_marks=10.0,
        teacher_answer=teacher_answer,
        rubric=rubric,
    )

    latency = time.time() - real_start_time

    assert isinstance(result, EvaluationResponse)
    assert isinstance(tokens, int)
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
    result, tokens = await EvaluationService.evaluate(
        question="Explain the theory of relativity.",
        student_answer="I don't know, an apple fell on his head?",
        max_marks=10.0,
        teacher_answer="E=mc^2 and the laws of physics are the same for all non-accelerating observers.",
        rubric="Provide structural feedback and score strictly.",
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert isinstance(tokens, int)
    assert result.score < 5.0

    logger.info(
        "Poor Answer Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_evaluate_empty_answer():
    start_time = time.time()
    result, tokens = await EvaluationService.evaluate(
        question="Describe the process of cellular respiration.",
        student_answer="",
        max_marks=10.0,
        teacher_answer="It is a set of metabolic reactions that convert biochemical energy into ATP.",
        rubric="Strictly give 0 if there is no answer.",
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert isinstance(tokens, int)
    assert result.score == 0.0

    logger.info(
        "Empty Answer Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_evaluate_partial_answer():
    start_time = time.time()
    result, tokens = await EvaluationService.evaluate(
        question="Name two primary differences between plant and animal cells.",
        student_answer="Plant cells have a cell wall.",
        max_marks=10.0,
        teacher_answer="1) Plant cells have a cell wall. 2) Plant cells have chloroplasts.",
        rubric="Give 5 marks for each correct difference.",
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert isinstance(tokens, int)
    assert 3.0 <= result.score <= 7.0

    logger.info(
        "Partial Answer Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_evaluate_no_teacher_answer():
    start_time = time.time()
    result, tokens = await EvaluationService.evaluate(
        question="What is the chemical formula for water?",
        student_answer="H2O",
        max_marks=5.0,
        teacher_answer=None,
        rubric=None,
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert isinstance(tokens, int)
    assert result.score == 5.0

    logger.info(
        "No Teacher Answer Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )


@pytest.mark.asyncio(loop_scope="session")
async def test_evaluate_custom_max_marks():
    start_time = time.time()
    result, tokens = await EvaluationService.evaluate(
        question="What evaluates to 10 * 10?",
        student_answer="It evaluates to 100.",
        max_marks=2.5,
        teacher_answer="100",
        rubric="Full marks if the number 100 is mentioned.",
    )
    latency = time.time() - start_time

    assert isinstance(result, EvaluationResponse)
    assert isinstance(tokens, int)
    assert result.score == 2.5

    logger.info(
        "Custom Max Marks Metrics",
        latency=round(latency, 4),
        score=result.score,
        feedback=result.feedback,
    )
