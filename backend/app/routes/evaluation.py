import time
import json
from bson import ObjectId

from fastapi import APIRouter, HTTPException
from groq import Groq

from app.system_params import system_prompt
from app.database.connections import question_papers

from app.utils.keys import GROQ_API_KEY
from app.utils.routelogger import log_route

groqclient = Groq(api_key=GROQ_API_KEY)

router = APIRouter(prefix="/api")

@router.put("/evaluate/{paper_id}", response_model=dict)
@log_route(path="/evaluate/{paper_id}", method="PUT")
async def evaluate_paper(paper_id: str):
    """Evaluate a paper using Groq."""
    
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
        
@router.put("/reset/{paper_id}", response_model=dict)
@log_route(path="/reset/{paper_id}", method="PUT")
async def reset_evaluation(paper_id: str):
    """Reset evaluation for a paper."""
    
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