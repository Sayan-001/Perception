"""
Database Package

Exports:
- db: Database connection instance
- init_db: Function to initialize the database
- association: Collection for teacher-student associations
- question_papers: Collection for question papers
- types: Collection for user types
"""

from .connections import association, db, init_db, question_papers, types

__all__ = [
    "db",
    "init_db",
    "association",
    "question_papers", 
    "types"
]