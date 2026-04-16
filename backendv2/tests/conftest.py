import pytest

# Global pytest configurations can go here. 
# For async tests to execute without warnings in newer pytest-asyncio versions:
@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
