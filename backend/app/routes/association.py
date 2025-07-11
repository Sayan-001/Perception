from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.database import association, types

router = APIRouter(prefix="/api")

class Association(BaseModel):
    teacher_email: EmailStr
    student_email: EmailStr
    
@router.post("/tsa", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_tsa(request: Association):
    """Add a teacher-student association to the database."""
        
    try:
        exists = await association.find_one(request.model_dump())
        
        if exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Association already exists"
            )
            
        exists = await types.find_one({"email": request.student_email, "type": "student"})
        
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
            
        exists = await types.find_one({"email": request.teacher_email, "type": "teacher"})
        
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        resp = await association.insert_one(request.model_dump())
        
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
        
@router.delete("/tsa", response_model=dict, status_code=status.HTTP_200_OK)
async def delete_tsa(request: Association):
    """Remove a teacher-student association from the database."""
    
    try:
        result = await association.delete_one(request.model_dump())
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Association not found"
            )
            
        return {
            "message": "Association deleted successfully"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/teacherlist", response_model=dict, status_code=status.HTTP_200_OK)
async def get_teachers(email: EmailStr):
    """Get all teachers associated with a student."""
    
    try:
        assc_list = await association.find({"student_email": email}).to_list()
        teachers_list = [teacher["teacher_email"] for teacher in assc_list]
        
        return {
            "teachers": teachers_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/studentlist", response_model=dict, status_code=status.HTTP_200_OK)
async def get_students(email: EmailStr):
    """Get all students associated with a teacher."""
    
    try:
        assc_list = await association.find({"teacher_email": email}).to_list()
        students_list = [student["student_email"] for student in assc_list]
        
        return {
            "students": students_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"      
        ) 