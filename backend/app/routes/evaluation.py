import os
import time
import json
from bson import ObjectId
from dotenv import load_dotenv

from fastapi import APIRouter, HTTPException
from groq import Groq

from app.system_params import system_prompt
from app.database.connections import question_papers

load_dotenv()
groqclient = Groq(api_key=os.getenv("GROQ_API_KEY"))

router = APIRouter(prefix="/api")

@router.put("/evaluate/{paper_id}", response_model=dict)
async def evaluate_paper(paper_id: str):
    """
    Evaluate a paper using AI.
    
    Args:
    - paper_id: str: The ID of the paper to evaluate.
    
    Returns:
    - dict: A message indicating the status of the evaluation.
    
    Raises:
    - HTTPException: If the paper is not found, has no submissions, or if the evaluation fails.
    - HTTPException: If there is an internal server error.
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
                                "content": system_prompt.strip(),
                            },
                            {
                                "role": "user",
                                "content": to_eval.strip(),
                            }
                        ],
                        model="llama-3.3-70b-versatile",
                        max_tokens=256,
                        response_format={"type": "json_object"},
                        temperature=0.4,
                    )
                    evaluation = json.loads(completion.choices[0].message.content)
                    time.sleep(0.5)
                
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
                
                total_score += evaluation["scores"]["average"]
            
            paper["submissions"][i]["total_score"] = total_score
                
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
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.put("/api/reset/{paper_id}", response_model=dict)
async def reset_evaluation(paper_id: str):
    """
    Reset evaluation for a paper.
    
    Args:
    - paper_id: str: The ID of the paper to reset evaluation for.
    
    Returns:
    - dict: A message indicating the status of the reset.
    
    Raises:
    - HTTPException: If the paper is not found, has no submissions, or if the reset fails.
    - HTTPException: If there is an internal server error.
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