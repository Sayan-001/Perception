import os
import json
import time
from dotenv import load_dotenv

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId

from groq import Groq

from contextlib import asynccontextmanager
from system_params import system_prompt_eval
from configurations import init_db, association, question_papers, types
from database.models import TeacherStudentAssociation, Score

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)
router = APIRouter()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groqclient = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.get("/api/get-type", response_model=dict)
async def get_type(email: str):
    """
    Used to get the type of user (teacher or student).
    Works synchronously with login.
    """
    
    try:
        user = await types.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "type": user["type"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
class AddUserTypeRequest(BaseModel):
    email: str
    user_type: str  
        
@app.post("/api/add-type", response_model=dict)
async def add_type(request: AddUserTypeRequest):
    """
    Used to create the type of user (teacher or student).
    Works synchronously with sign-up.
    """
    try:
        exists = await types.find_one({"email": request.email})
        if exists is not None:
            raise HTTPException(
                status_code=400,
                detail="User already exists"
            )
            
        resp = await types.insert_one({
            "email": request.email,
            "type": request.user_type
        })
        
        return {
            "id": str(resp.inserted_id)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    
@app.post("/add-tsa", response_model=dict)
async def add_tsa(request: TeacherStudentAssociation):
    try:
        exists = await association.find_one(request.model_dump())
        if exists is not None:
            raise HTTPException(
                status_code=400,
                detail="Association already exists"
            )
        
        resp = await association.insert_one(request.model_dump())
        
        # wrap the BSON object id in a string to avoid serialization issues
        return {
            "data": str(resp.inserted_id),
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@app.get("/get-teachers", response_model=dict)
async def get_tsa_for_student(student_email: str):
    try:
        teachers_list = await association.find({"student_email": student_email}).to_list(length=None)
        teachers_list = [teacher["teacher_email"] for teacher in teachers_list]
        
        return {
            "data": teachers_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@app.get("/get-students", response_model=dict)
async def get_tsa_for_teacher(teacher_email: str):
    try:
        students_list = await association.find({"teacher_email": teacher_email}).to_list(length=None)
        students_list = [student["student_email"] for student in students_list]
        
        return {
            "data": students_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
            
        )     
        
class ViewPaperRequest(BaseModel):
    paper_id: str
    viewer_email: str
        
@app.post("/api/paper/{paper_id}", response_model=dict)
async def get_paper(request: ViewPaperRequest):
    """
    Retrieve a paper for a student or teacher.
    
    If the viewer is the teacher, return the paper as is.
    If the viewer is a student of the teacher, return the paper with the student's answers.
    If the viewer is not authorized, return a 403 error.
    
    The paper is returned as a list of questions with the student's answers if available.
    The student's answers are returned as a list of dictionaries with the following keys:
    - order: the order of the question in the paper
    - answer: the student's answer
    - scores: the scores assigned by the teacher
    - feedback: the feedback provided by the teacher
    
    The paper is returned as a dictionary with the following keys
    - _id: the paper's id
    - title: the paper's title
    - questions: a list of questions with the student's answers
    - expired: a boolean indicating if the paper has expired
    - evaluated: a boolean indicating if the paper has been evaluated
    """
    
    paper_id, viewer_email = request.paper_id, request.viewer_email
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if paper is None:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        paper_dict = dict(paper)
        paper_dict["_id"] = str(paper_dict["_id"])
            
        # Check if viewer is the teacher
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
        
        # Check if student has attempted
        attempted = False
        student_answers = None
        
        for submission in paper.get("submissions", []):
            if submission["student_email"] == viewer_email:
                attempted = True
                student_answers = submission["answers"]
                break

        # Prepare student view
        questions_data = []
        for question in paper["questions"]:
            question_data = {
                "order": question["order"],
                "question": question["question"]
            }

            if attempted:
                # Find matching answer
                answer = next(
                    (ans for ans in student_answers if ans["order"] == question["order"]),
                    None
                )
                if answer:
                    answer_copy = answer.copy()
                    question_data = question_data | answer_copy
            else:
                # Create empty answer template
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
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@app.get("/api/all-papers", response_model=dict)
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

@app.put("/api/evaluate/{paper_id}", response_model=dict)
async def evaluate_paper(paper_id: str):
    """
    Evaluate all submissions for a paper using Groq AI.
    Updates scores and feedback for all student answers.
    """
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        if not paper.get("submissions"):
            raise HTTPException(status_code=400, detail="No submissions to evaluate")

        questions = dict()
        teacher_answers = dict()
        for question in paper["questions"]:
            questions[question["order"]] = question["question"]
            teacher_answers[question["order"]] = question["answer"]

        for i in range(len(paper["submissions"])):
            stud_submission = paper["submissions"][i]
            total_score = 0
            
            for j in range(len(stud_submission["answers"])):
                try:
                    stud_answer = stud_submission["answers"][j]
                    to_eval = f"""
                    Question: {questions[stud_answer["order"]]}
                    Teacher's Answer: {teacher_answers[stud_answer["order"]]}
                    Student's Answer: {stud_answer["answer"]}
                    """
                    
                    completion = groqclient.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": system_prompt_eval.strip(),
                            },
                            {
                                "role": "user",
                                "content": to_eval.strip(),
                            }
                        ],
                        model="llama-3.3-70b-versatile",
                        max_tokens=256,
                        response_format={"type": "json_object"},
                        temperature=0.7,
                    )
                    evaluation = json.loads(completion.choices[0].message.content)
                    print(evaluation)
                
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"AI evaluation failed: {str(e)}"
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to process evaluation: {str(e)}"
                    )
                
                # Update the student's answer with the scores and feedback
                paper["submissions"][i]["answers"][j]["scores"] = evaluation["scores"]
                paper["submissions"][i]["answers"][j]["feedback"] = evaluation["feedback"]
                
                # Add to total score
                total_score += evaluation["scores"]["average"]
            
            # Update total score for this submission
            paper["submissions"][i]["total_score"] = total_score
                
        # Update the paper with the evaluated submissions
        result = await question_papers.update_one(
            {"_id": ObjectId(paper_id)},
            {"$set": {"submissions": paper["submissions"], "evaluated": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to update paper with evaluations"
            )
        
        return {
            "message": "Paper evaluated successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )    
        
@app.put("/api/reset/{paper_id}", response_model=dict)
async def reset_evaluation(paper_id: str):
    """
    Reset evaluation for a paper.
    """
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        if not paper.get("submissions"):
            raise HTTPException(status_code=400, detail="No submissions to evaluate")
        
        if paper["evaluated"] == False:
            raise HTTPException(status_code=400, detail="Paper has not been evaluated")
        
        evaluation = {
            "scores": {
                "clarity": 0,
                "relevance": 0,
                "accuracy": 0,
                "completeness": 0,
                "average": 0
            },
            "feedback": ""
        }

        for i in range(len(paper["submissions"])):
            stud_submission = paper["submissions"][i]
        
            for j in range(len(stud_submission["answers"])):                
                paper["submissions"][i]["answers"][j]["scores"] = evaluation["scores"]
                paper["submissions"][i]["answers"][j]["feedback"] = evaluation["feedback"]
                
            paper["submissions"][i]["total_score"] = 0
                
        result = await question_papers.update_one(
            {"_id": ObjectId(paper_id)},
            {"$set": {"submissions": paper["submissions"], "evaluated": False}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to reset evaluation for paper"
            )
        
        return {
            "message": "Paper reset successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )  


app.include_router(router)