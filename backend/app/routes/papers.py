from typing import List, Literal

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.database import association, question_papers, types

router = APIRouter(prefix="/api")

class Score(BaseModel):
    clarity: float = 0.0
    relevance: float = 0.0
    accuracy: float = 0.0
    completeness: float = 0.0
    average: float = 0.0

class BaseAnswer(BaseModel):
    order: int
    answer: str

class StudentAnswer(BaseAnswer):
    scores: Score = Field(default_factory=Score)
    feedback: str = ""
    
class StudentSubmission(BaseModel):
    student_email: EmailStr
    answers: List[StudentAnswer]
    total_score: float = 0.0
    
class Question(BaseModel):
    order: int
    question: str
    answer: str
   
class Paper(BaseModel):
    teacher_email: EmailStr
    title: str
    evaluated: bool = False
    expired: bool = False
    questions: List[Question]
    submissions: List[StudentSubmission]
    
@router.get("/paper/list", response_model=dict, status_code=status.HTTP_200_OK)
async def get_paperlist(email: str, user_type: Literal["teacher", "student"]):
    """Retrieve all papers with just the metadata (required for the cards), based on user type."""
    
    try:
        if user_type == "teacher":
            paper_list: List[Paper] = await question_papers.find({"teacher_email": email}).to_list()
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
            
        elif user_type == "student":
            associations = await association.find({"student_email": email}).to_list()
            teacher_emails: List[str] = [assc["teacher_email"] for assc in associations]
            
            paper_list: List[Paper] = await question_papers.find({"teacher_email": {"$in": teacher_emails}}).to_list()
        
            paper_list = [
                {
                    "_id": str(paper["_id"]),
                    "title": paper["title"],
                    "expired": paper["expired"],
                    "evaluated": paper["evaluated"],
                    "user_type": "student",
                    "attempted": any(sub["student_email"] == email for sub in paper["submissions"])
                }
                for paper in paper_list
            ]
            
            return {
                "papers": paper_list
            }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"   
        )

@router.post("/paper/create", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_paper(paper: Paper):
    """Create a new question paper."""
    
    try:
        exists: Paper = await types.find_one({"email": paper.teacher_email})
        
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        response = await question_papers.insert_one(paper.model_dump())
        
        return {
            "id": str(response.inserted_id)
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/paper/view/{paper_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def get_paper(paper_id: str, viewer_email: str, viewer_type: Literal["teacher", "student"]):
    """Retrieve a paper with all the details."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        
        if paper is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
            
        if viewer_type == "teacher":
            if paper["teacher_email"] != viewer_email:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
                
            paper.pop("_id")
            
            return {
                "paper": paper
            }
                 
        elif viewer_type == "student":  
            submission = next((sub for sub in paper.get("submissions", []) if sub["student_email"] == viewer_email), None)
            
            if submission is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not Attempted Yet")
                
            structure: dict[int, dict] = {}
            for q in paper["questions"]:
                structure[q["order"]] = {"question": q["question"]}
                
            answers = submission["answers"]
            
            for ans in answers:
                structure[ans["order"]].update({
                    "answer": ans["answer"],
                    "scores": ans["scores"],
                    "feedback": ans["feedback"]
                })
                
            return {
                "title": paper["title"],
                "teacher_email": paper["teacher_email"],
                "expired": paper["expired"],
                "evaluated": paper["evaluated"],
                "qs_and_ans": list(structure.values()),
                "total_score": submission["total_score"]
            }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/paper/attempt/{paper_id}", response_model=dict)
async def get_attempt_paper(paper_id: str, student_email: str):
    """Retrieve a paper for attempting."""
    
    try:
        paper: Paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        
        if paper is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
        if paper["teacher_email"] == student_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot attempt own paper")
        
        assoc = await association.find_one({"teacher_email": paper["teacher_email"], "student_email": student_email})
        if assoc is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
            
        questions = [{"order": q["order"], "question": q["question"]} for q in paper["questions"]]
        
        return {
            "title": paper["title"],
            "teacher_email": paper["teacher_email"],
            "questions": questions
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
    
class SubmitAnswerRequest(BaseModel):
    paper_id: str
    student_email: str
    answer: List[BaseAnswer]
        
@router.post("/paper/attempt", response_model=dict)
async def attempt_paper(request: SubmitAnswerRequest):
    """Attempt/Save a paper."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(request.paper_id)})
        if paper is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
        
        student_email = request.student_email
        answers = [StudentAnswer(**answer.model_dump()).model_dump() for answer in request.answer]
            
        existing_submission = await question_papers.find_one(
            {"_id": ObjectId(request.paper_id), "submissions.student_email": student_email}
        )

        if existing_submission:
            await question_papers.update_one(
                {"_id": ObjectId(request.paper_id), "submissions.student_email": student_email},
                {"$set": {
                    "submissions.$.answers": answers,
                }}
            )
        else:
            await question_papers.update_one(
                {"_id": ObjectId(request.paper_id)},
                {"$push": {
                    "submissions": {
                        "student_email": student_email,
                        "answers": answers,
                        "total_score": 0.0
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.put("/paper/expire/{paper_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def expire_paper(paper_id: str):
    """Expire a paper."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        
        if paper is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
            
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.put("/paper/unexpire/{paper_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def unexpire_paper(paper_id: str):
    """Unexpire a paper."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
            
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.delete("/paper/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(paper_id: str):
    """Delete a paper if it belongs to the requesting teacher."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
            
        await question_papers.delete_one({"_id": ObjectId(paper_id)})
        return None
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )