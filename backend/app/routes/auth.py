from fastapi import APIRouter, HTTPException
from app.database.connections import types
from pydantic import BaseModel
from enum import Enum

router = APIRouter(prefix="/api")

@router.get("/get-type", response_model=dict)
async def get_type(email: str):
    """
    Used to get the type of user (teacher or student).
    
    Args:
    - email: Email of the user
    
    Returns:
    - type: Type of the user
    
    Raises:
    - 404: If user not found
    - 500: Internal server error
    """
    
    try:
        user = await types.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "type": user["type"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
   
class UserType(str, Enum):
    teacher = "teacher"
    student = "student"
     
class AddUserTypeRequest(BaseModel):
    email: str
    user_type: UserType
        
@router.post("/add-type", response_model=dict)
async def add_type(request: AddUserTypeRequest):
    """
    Used to add the type of user (teacher or student).
    
    Args:
    - email: Email of the user
    - user_type: Type of the user
    
    Returns:
    - id: ID of the user
    
    Raises:
    - 400: If user already exists
    - 500: Internal server error
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