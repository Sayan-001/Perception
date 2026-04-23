from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

from app.auth.route import router as auth_router
from app.papers.route import router as papers_router
from app.submissions.route import router as submissions_router
from app.evaluations.route import router as evaluations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        import app.core.model
        import app.auth.model
        import app.papers.model
        import app.submissions.model

        await conn.run_sync(Base.metadata.create_all)
    yield

    # shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    openapi_url="/openapi.json" if settings.ENVIRONMENT == "development" else None,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
    debug=settings.ENVIRONMENT == "development",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(papers_router)
app.include_router(submissions_router)
app.include_router(evaluations_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
