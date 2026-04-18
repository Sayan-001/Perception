from enum import Enum


class UserType(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class EvaluationStatus(str, Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
