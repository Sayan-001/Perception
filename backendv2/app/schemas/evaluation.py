from pydantic import BaseModel, Field


class EvaluationResponse(BaseModel):
    """
    Response schema for the evaluation of a student's answer.
    """

    score: float = Field(
        ge=0.0,
        le=10.0,
        default=0.0,
        description="The score awarded out of 10 based on the rubric.",
    )
    feedback: str = Field(
        default="",
        description="Feedback to the student highlighting mistakes, without providing the correct answer.",
    )
