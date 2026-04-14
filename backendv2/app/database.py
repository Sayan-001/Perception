from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

# Create async engine. Neon uses serverless connection pooling,
# but it's good practice to set pool sizes to prevent connection exhaustion.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Useful for debugging, set to False in production
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for SQLAlchemy models
Base = declarative_base()


# Dependency to yield database sessions
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
