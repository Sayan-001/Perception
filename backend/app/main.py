from config import create_app
from routes import auth, association, papers, evaluation

app = create_app()

app.include_router(auth.router)
app.include_router(association.router)
app.include_router(papers.router)
app.include_router(evaluation.router)