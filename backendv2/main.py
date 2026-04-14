from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs when the app starts
    # Note: In production you'd use Alembic.
    # For now, let's auto-create tables if they don't exist.
    async with engine.begin() as conn:
        # Import models so SQLAlchemy knows about them
        from app.models import __all__

        await conn.run_sync(Base.metadata.create_all)
    yield
    # This runs when the app shuts down
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
