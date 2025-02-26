from .models import TeacherStudentAssociation

def tsa_data(tsa: TeacherStudentAssociation):
    return {
        "teacher_email": tsa.teacher_email,
        "student_email": tsa.student_email
    }
    