import json
import time

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status
from groq import Groq

from app.database import question_papers
from app.system_params import system_prompt
from app.utils.vars import GROQ_API_KEY

groqclient = Groq(api_key=GROQ_API_KEY)

router = APIRouter(prefix="/api")

@router.put("/evaluate/{paper_id}", response_model=dict)
async def evaluate_paper(paper_id: str):
    """Evaluate a paper using Groq."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if not paper:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

        if not paper.get("submissions"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No submissions to evaluate")

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
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"AI evaluation failed: {str(e)}"
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update paper with evaluations"
            )
        
        return {
            "message": "Paper evaluated successfully"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.put("/reset/{paper_id}", response_model=dict)
async def reset_evaluation(paper_id: str):
    """Reset evaluation for a paper."""
    
    try:
        paper = await question_papers.find_one({"_id": ObjectId(paper_id)})
        if not paper:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

        if not paper.get("submissions"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No submissions to evaluate")
        
        if not paper["evaluated"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paper has not been evaluated")
        
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
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset evaluation for paper"
            )
        
        return {
            "message": "Paper reset successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        ) 