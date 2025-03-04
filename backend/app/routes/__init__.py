"""
API Routes
---------
Contains all API route handlers for:
- auth: User authentication and type management
- association: Teacher-student relationships
- papers: Question paper CRUD operations
- evaluation: AI-based answer evaluation
"""

from . import auth
from . import association
from . import papers
from . import evaluation

__all__ = ["auth", "association", "papers", "evaluation"]