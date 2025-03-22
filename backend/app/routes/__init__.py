"""
API Routes
---------
Contains all API route handlers for:
- types: type management
- association: Teacher-student relationships
- papers: Question paper CRUD operations
- evaluation: AI-based answer evaluation and reset
"""

from . import types
from . import association
from . import papers
from . import evaluation

__all__ = ["types", "association", "papers", "evaluation"]