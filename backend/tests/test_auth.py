import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import AsyncSessionLocal
from app.auth.model import AppUser
from main import app


@pytest_asyncio.fixture(loop_scope="session")
async def unique_email():
    email = f"test_{uuid.uuid4()}@example.com"
    yield email

    async with AsyncSessionLocal() as session:
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
            await session.commit()


@pytest.fixture
def test_password():
    return "secure_password_123!"


@pytest.mark.asyncio(loop_scope="session")
async def test_signup_success(unique_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/signup",
            json={
                "email": unique_email,
                "password": test_password,
                "full_name": "John Doe",
                "user_type": "student",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == unique_email
        assert data["full_name"] == "John Doe"
        assert data["user_type"] == "student"


@pytest.mark.asyncio(loop_scope="session")
async def test_signup_duplicate_email(unique_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        payload = {
            "email": unique_email,
            "password": test_password,
            "full_name": "Jane Doe",
            "user_type": "teacher",
        }
        await ac.post("/auth/signup", json=payload)
        response = await ac.post("/auth/signup", json=payload)
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"


@pytest.mark.asyncio(loop_scope="session")
async def test_signup_invalid_email(test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/signup",
            json={
                "email": "not-an-email",
                "password": test_password,
                "full_name": "Invalid Email",
                "user_type": "student",
            },
        )
        assert response.status_code == 422


@pytest.mark.asyncio(loop_scope="session")
async def test_signup_missing_fields(unique_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/signup",
            json={
                "email": unique_email,
                "password": test_password,
            },
        )
        assert response.status_code == 422


@pytest.mark.asyncio(loop_scope="session")
async def test_signup_invalid_user_type(unique_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/signup",
            json={
                "email": unique_email,
                "password": test_password,
                "full_name": "Bad Type",
                "user_type": "superadmin_hacker",
            },
        )
        assert response.status_code == 422


@pytest.mark.asyncio(loop_scope="session")
async def test_login_success(unique_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": unique_email,
                "password": test_password,
                "full_name": "Valid User",
                "user_type": "student",
            },
        )
        response = await ac.post(
            "/auth/login",
            data={
                "username": unique_email,
                "password": test_password,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data


@pytest.mark.asyncio(loop_scope="session")
async def test_login_incorrect_password(unique_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": unique_email,
                "password": test_password,
                "full_name": "Wrong Password User",
                "user_type": "student",
            },
        )
        response = await ac.post(
            "/auth/login",
            data={
                "username": unique_email,
                "password": "wrong_password",
            },
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio(loop_scope="session")
async def test_login_nonexistent_email(test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/login",
            data={
                "username": f"missing_{uuid.uuid4()}@example.com",
                "password": test_password,
            },
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio(loop_scope="session")
async def test_login_invalid_email_format(test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/login",
            data={
                "username": "just-a-random-string",
                "password": test_password,
            },
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio(loop_scope="session")
async def test_login_missing_fields(unique_email):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        response = await ac.post(
            "/auth/login",
            data={
                "username": unique_email,
            },
        )
        assert response.status_code == 422
