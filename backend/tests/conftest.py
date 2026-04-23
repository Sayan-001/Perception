import pytest
import pytest_asyncio
from app.database import engine


# Global pytest configurations can go here.
# For async tests to execute without warnings in newer pytest-asyncio versions:
@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="session", autouse=True)
async def cleanup_db_engine():
    # Yield control to the tests
    yield
    # After all tests finish across the entire session, gracefully dispose of all connection pools
    # to avoid "got Future attached to a different loop" or "Event loop is closed" errors.
    await engine.dispose()
