import enum


class UserType(str, enum.Enum):
    student = "student"
    teacher = "teacher"


class EvaluationStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
