from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from typing import List
from database.connections import question_papers, association

router = APIRouter(prefix="/api")

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

@router.post("/create-paper", response_model=dict)
async def create_paper(request: QuestionPaper):
    """
    Create a new question paper.
    """
    try:
        paper = await question_papers.insert_one(request)
        
        return {
            "id": str(paper.inserted_id)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
class ViewPaperRequest(BaseModel):
    paper_id: str
    viewer_email: str
        
@router.post("/paper/{paper_id}", response_model=dict)
async def get_paper(request: ViewPaperRequest):
    """
    Retrieve a paper for a student or teacher.
    
    If the viewer is the teacher, returns the paper as is.
    If the viewer is a student of the teacher, returns the paper with the student's answers.
    If the viewer is not authorized, returns a 403 error.
    """
    
    paper_id, viewer_email = request.paper_id, request.viewer_email
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        paper_dict = dict(paper)
        paper_dict["_id"] = str(paper_dict["_id"])
            
        if viewer_email == paper["teacher_email"]:
            return {
                "type": "teacher",
                "paper": paper_dict
            }
            
        student_exists = await association.find_one({
            "teacher_email": paper["teacher_email"],
            "student_email": viewer_email
        })
        
        if not student_exists:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this paper"
            )
        
        attempted = False
        student_answers = None
        
        for submission in paper.get("submissions", []):
            if submission["student_email"] == viewer_email:
                attempted = True
                student_answers = submission["answers"]
                break

        questions_data = []
        for question in paper["questions"]:
            question_data = {
                "order": question["order"],
                "question": question["question"]
            }

            if attempted:
                answer = next(
                    (ans for ans in student_answers if ans["order"] == question["order"]),
                    None
                )
                if answer:
                    answer_copy = answer.copy()
                    question_data = question_data | answer_copy
            else:
                question_data["answer"] = {
                    "answer": "",
                    "scores": Score().model_dump(),
                    "feedback": ""
                }

            questions_data.append(question_data)

        return {
            "type": "student",
            "attempted": attempted,
            "paper": questions_data
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/all-papers", response_model=dict)
async def get_all_papers(email: str):
    try:
        paper_list = await question_papers.find({"teacher_email": email}).to_list(length=None)
        paper_list = [
            {
                "_id": str(paper["_id"]),
                "title": paper["title"],
                "expired": paper["expired"],
                "evaluated": paper["evaluated"],
                "user_type": "teacher"
            }
            for paper in paper_list
        ]
        
        return {
            "papers": paper_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"   
        )