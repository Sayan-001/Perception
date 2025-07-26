import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, initialize_app

from app.database import init_db
from app.routes import association, evaluation, papers, types
from app.utils.vars import ENVIRONMENT


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    lifespan=lifespan,
    title="Perception Backend API",
    openapi_url="/openapi.json" if ENVIRONMENT == "development" else None,
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url=None
)

cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "admin-cred.json"))
initialize_app(cred)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(types.router)
app.include_router(association.router)
app.include_router(papers.router)
app.include_router(evaluation.router)