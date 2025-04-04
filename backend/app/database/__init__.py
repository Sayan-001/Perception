"""
Database Package
--------------
MongoDB connection and model management for Perception.

Exports:
- Database initialization
- Collection connections
"""

from .connections import (
    db,
    init_db,
    association,
    question_papers,
    types
)

__all__ = [
    "db",
    "init_db",
    "association",
    "question_papers", 
    "types"
]