from pydantic import BaseModel

# Utilizing the schemas from app.submissions.schemas for response.
# Additional evaluation specific schemas can be added here if needed.
class EvaluationMessageOut(BaseModel):
    message: str
