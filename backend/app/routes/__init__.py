"""
API Routes

Exports:
- types: type management
- association: Teacher-student relationships
- papers: Question paper CRUD operations
- evaluation: AI-based answer evaluation and reset
"""

from . import association, evaluation, papers, types

__all__ = ["types", "association", "papers", "evaluation"]
