from typing import Literal
from fastapi import APIRouter, HTTPException, status
from app.database.connections import types
from pydantic import EmailStr, BaseModel
from app.utils.routelogger import log_route

router = APIRouter(prefix="/api")

@router.get("/type", response_model=dict, status_code=status.HTTP_200_OK)
@log_route(path="/type", method="GET")
async def get_type(email: str):
    """Used to get the type of user."""
    
    try:
        user = await types.find_one({"email": email})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return {
            "type": user["type"]
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
class AddUserType(BaseModel):
    email: EmailStr
    user_type: Literal["teacher", "student"]
        
@router.post("/type", response_model=dict, status_code=status.HTTP_201_CREATED)
@log_route(path="/type", method="POST")
async def add_type(request: AddUserType):
    """Used to add the type of user if not exists, else raise an error."""
    
    try:
        exists = await types.find_one({"email": request.email})
        
        if exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )
            
        resp = await types.insert_one({"email": request.email, "type": request.user_type})
        
        return {
            "id": str(resp.inserted_id)
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )