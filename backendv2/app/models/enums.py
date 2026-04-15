from enum import Enum


class UserType(str, Enum):
    student = "student"
    teacher = "teacher"


class EvaluationStatus(str, Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
