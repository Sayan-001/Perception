import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.auth.model import AppUser
from app.database import AsyncSessionLocal
from main import app


@pytest_asyncio.fixture(loop_scope="session")
async def teacher_credentials():
    email = f"teacher_{uuid.uuid4()}@example.com"
    password = "secure_password_123!"
    yield {
        "email": email,
        "password": password,
        "full_name": "Test Teacher",
        "user_type": "teacher",
    }
    async with AsyncSessionLocal() as session:
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
            await session.commit()


@pytest_asyncio.fixture(loop_scope="session")
async def student_credentials():
    email = f"student_{uuid.uuid4()}@example.com"
    password = "secure_password_123!"
    yield {
        "email": email,
        "password": password,
        "full_name": "Test Student",
        "user_type": "student",
    }
    async with AsyncSessionLocal() as session:
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
            await session.commit()


@pytest_asyncio.fixture(loop_scope="session")
async def teacher_auth_headers(teacher_credentials):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        await ac.post("/api/auth/signup", json=teacher_credentials)
        response = await ac.post(
            "/api/auth/login",
            data={
                "username": teacher_credentials["email"],
                "password": teacher_credentials["password"],
            },
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(loop_scope="session")
async def student_auth_headers(student_credentials):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        await ac.post("/api/auth/signup", json=student_credentials)
        response = await ac.post(
            "/api/auth/login",
            data={
                "username": student_credentials["email"],
                "password": student_credentials["password"],
            },
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


def get_paper_payload():
    return {
        "title": "Test Paper",
        "start_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "duration_minutes": 120,
        "is_published": False,
        "questions": [
            {
                "question_text": "What is 2 + 2?",
                "model_answer": "4",
                "rubric": "1 mark for correct answer",
                "marks_assigned": 1.0,
                "sort_order": 1,
            }
        ],
    }


@pytest.mark.asyncio(loop_scope="session")
async def test_create_paper_success(teacher_auth_headers):
    payload = get_paper_payload()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/papers/",
            json=payload,
            headers=teacher_auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert len(data["questions"]) == 1
        assert (
            data["questions"][0]["question_text"]
            == payload["questions"][0]["question_text"]
        )
        assert float(data["total_marks"]) - 1.0 < 0.001


@pytest.mark.asyncio(loop_scope="session")
async def test_create_paper_as_student_forbidden(student_auth_headers):
    payload = get_paper_payload()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/papers/",
            json=payload,
            headers=student_auth_headers,
        )
        assert response.status_code == 403


@pytest.mark.asyncio(loop_scope="session")
async def test_create_paper_unauthorized():
    payload = get_paper_payload()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/papers/",
            json=payload,
        )
        assert response.status_code == 401


@pytest.mark.asyncio(loop_scope="session")
async def test_create_paper_missing_title(teacher_auth_headers):
    payload = get_paper_payload()
    del payload["title"]
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/papers/",
            json=payload,
            headers=teacher_auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.asyncio(loop_scope="session")
async def test_create_paper_invalid_questions(teacher_auth_headers):
    payload = get_paper_payload()
    payload["questions"] = [
        {"question_text": "No marks assigned"}
    ]  # Missing required fields
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/papers/",
            json=payload,
            headers=teacher_auth_headers,
        )
        assert response.status_code == 422
