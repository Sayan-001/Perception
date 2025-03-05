from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from typing import List
from app.database.connections import question_papers, association

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
    
    Args:
    - teacher_email: Email of the teacher creating the paper
    - title: Title of the paper
    - questions: List of questions in the paper
    - submissions: List of student submissions
    
    Returns:
    - id: ID of the created paper
    
    Raises:
    - HTTPException(500): Internal server error
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
        
@router.get("/teacher-papers", response_model=dict)
async def get_teacher_papers(email: str):
    """
    Retrieve all papers for a teacher.
    
    Args:
    - email: Email of the teacher
    
    Returns:
    - papers: List of papers
    
    Raises:
    - HTTPException(500): Internal server error
    """
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
        
@router.put("/expire-paper/{paper_id}", response_model=dict)
async def expire_paper(paper_id: str):
    """
    Expire a paper.
    
    Args:
    - paper_id: ID of the paper
    
    Returns:
    - message: Success message
    
    Raises:
    - HTTPException(404): Paper not found
    - HTTPException(500): Internal server error
    """
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        await question_papers.update_one(
            {"_id": ObjectId(paper_id)},
            {"$set": {"expired": True}}
        )
        
        return {
            "message": "Paper expired successfully"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.put("/unexpire-paper/{paper_id}", response_model=dict)
async def unexpire_paper(paper_id: str):
    """
    Unexpire a paper.
    
    Args:
    - paper_id: ID of the paper
    
    Returns:
    - message: Success message
    
    Raises:
    - HTTPException(404): Paper not found
    - HTTPException(500): Internal server error
    """
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        await question_papers.update_one(
            {"_id": ObjectId(paper_id)},
            {"$set": {"expired": False}}
        )
        
        return {
            "message": "Paper unexpired successfully"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/student-papers", response_model=dict)
async def get_student_papers(email: str):
    """
    Retrieve all papers for a student with attempt status.
    
    Args:
    - email: Email of the student
    
    Returns:
    - papers: List of papers with attempt status
    """
    try:
        # Get all teachers associated with this student
        associations = await association.find(
            {"student_email": email}
        ).to_list(length=None)
        
        teacher_emails = [assoc["teacher_email"] for assoc in associations]
        
        # Get all papers from these teachers
        paper_list = await question_papers.find({
            "teacher_email": {"$in": teacher_emails}
        }).to_list(length=None)
        
        # Transform papers to include attempt status
        paper_list = [
            {
                "_id": str(paper["_id"]),
                "title": paper["title"],
                "expired": paper["expired"],
                "evaluated": paper["evaluated"],
                "user_type": "student",
                "attempted": any(
                    sub["student_email"] == email 
                    for sub in paper.get("submissions", [])
                )
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
  
class SingleAnswerRequest(BaseModel):
    order: int
    answer: str
    scores: Score = Score()
    feedback: str = ""
    
class SubmitAnswerRequest(BaseModel):
    student_email: str
    answer: List[SingleAnswerRequest]
    total_score: float = 0.0
        
@router.put("/attempt-paper/{paper_id}", response_model=dict)
async def attempt_paper(paper_id: str, request: SubmitAnswerRequest):
    """
    Attempt a paper.
    
    Args:
    - paper_id: ID of the paper
    - student_email: Email of the student
    - answer: List of answers
    
    Returns:
    - message: Success message
    
    Raises:
    - HTTPException(404): Paper not found
    - HTTPException(500): Internal server error
    """
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        await question_papers.update_one(
            {"_id": ObjectId(paper_id)},
            {"$push": {
                "submissions": {
                    "student_email": request.student_email,
                    "answers": request.answer,
                    "total_score": request.total_score
                }
            }}
        )
        
        return {
            "message": "Paper attempted successfully"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    