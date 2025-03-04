from pydantic import BaseModel
from typing import List

#Model for Teacher-Student Association
class TeacherStudentAssociation(BaseModel):
    teacher_email: str
    student_email: str
    
#Model for Score
class Score(BaseModel):
    clarity: float = 0.0
    relevance: float = 0.0
    accuracy: float = 0.0
    completeness: float = 0.0
    average: float = 0.0
    
#Model for Student Answer
class StudentAnswer(BaseModel):
    order: int
    answer: str = ""
    scores: Score
    feedback: str = ""
  
#Model for Student Submission  
class StudentSubmission(BaseModel):
    student_email: str
    answers: List[StudentAnswer]
    total_score: float = 0.0
 
#Model for Question   
class Question(BaseModel):
    order: int
    question: str
    answer: str
  
#Model for Question Paper  
class QuestionPaper(BaseModel):
    teacher_email: str
    title: str
    evaluated: bool = False
    expired: bool = False
    questions: List[Question]
    submissions: List[StudentSubmission]  