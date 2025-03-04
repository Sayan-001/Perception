from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.connections import association, types

router = APIRouter(prefix="/api")

class TeacherStudentAssociation(BaseModel):
    teacher_email: str
    student_email: str
    
@router.post("/add-tsa", response_model=dict)
async def add_tsa(request: TeacherStudentAssociation):
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
        
class GetTeachersRequest(BaseModel):
    student_email: str
        
@router.get("/get-teachers", response_model=dict)
async def get_teachers(request: GetTeachersRequest):
    try:
        assc_list = await association.find(request.model_dump()).to_list()
        teachers_list = [teacher["teacher_email"] for teacher in assc_list]
        
        return {
            "data": teachers_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
class GetStudentsRequest(BaseModel):
    teacher_email: str
        
@router.get("/get-students", response_model=dict)
async def get_students(request: GetStudentsRequest):
    try:
        assc_list = await association.find(request.model_dump()).to_list()
        students_list = [student["student_email"] for student in assc_list]
        
        return {
            "data": students_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
            
        ) 