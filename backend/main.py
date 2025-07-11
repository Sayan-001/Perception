import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, initialize_app

from app.database.connections import init_db
from app.routes import association, evaluation, papers, types
from app.utils import ENVIRONMENT


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

def create_app():
    app = FastAPI(
        lifespan=lifespan,
        title="Perception Backend API",
        description="API for the Perception application, handling teacher-student associations, papers, and evaluations.",
        version="1.0.0",
        openapi_url="/openapi.json" if ENVIRONMENT == "development" else None,
        docs_url="/docs" if ENVIRONMENT == "development" else None,
        redoc_url="/redoc" if ENVIRONMENT == "development" else None
    )
    
    cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "admin-cred.json"))
    initialize_app(cred)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app

app = create_app()

app.include_router(types.router)
app.include_router(association.router)
app.include_router(papers.router)
app.include_router(evaluation.router)