from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.connections import association, types

router = APIRouter(prefix="/api")

class TeacherStudentAssociation(BaseModel):
    teacher_email: str
    student_email: str
    
@router.post("/add-tsa", response_model=dict)
async def add_tsa(request: TeacherStudentAssociation):
    """
    Add a teacher-student association to the database.
    
    Args:
    - request: TeacherStudentAssociation: The request model containing the teacher and student emails.
    
    Returns:
    - dict: A dictionary containing the id of the inserted document.
    
    Raises:
    - HTTPException: If the association already exists, student or teacher is not found.
    - HTTPException: If there is an internal server error.
    """
    
    try:
        exists = await association.find_one(request.model_dump())
        if exists is not None:
            raise HTTPException(
                status_code=400,
                detail="Association already exists"
            )
            
        stud_exists = await types.find_one({"email": request.student_email, "type": "student"})
        
        if stud_exists is None:
            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )
            
        teach_exists = await types.find_one({"email": request.teacher_email, "type": "teacher"})
        
        if teach_exists is None:
            raise HTTPException(
                status_code=404,
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
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/get-teachers", response_model=dict)
async def get_teachers(email: str):
    """
    Get all teachers associated with a student.
    
    Args:
    - request: GetTeachersRequest: The request model containing the student email.
    
    Returns:
    - dict: A dictionary containing the list of teacher emails.
    
    Raises:
    - HTTPException: If there is an internal server error.
    """
    
    try:
        assc_list = await association.find({"student_email": email}).to_list()
        teachers_list = [teacher["teacher_email"] for teacher in assc_list]
        
        return {
            "data": teachers_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@router.get("/get-students", response_model=dict)
async def get_students(email: str):
    """
    Get all students associated with a teacher.
    
    Args:
    - request: GetStudentsRequest: The request model containing the teacher email.
    
    Returns:
    - dict: A dictionary containing the list of student emails.
    
    Raises:
    - HTTPException: If there is an internal server error.
    """
    
    try:
        assc_list = await association.find({"teacher_email": email}).to_list()
        students_list = [student["student_email"] for student in assc_list]
        
        return {
            "data": students_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
            
        ) 