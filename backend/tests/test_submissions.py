import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.auth.model import AppUser
from app.database import AsyncSessionLocal
from main import app


@pytest_asyncio.fixture(loop_scope="session")
async def teacher_credentials_sub():
    email = f"teacher_sub_{uuid.uuid4()}@example.com"
    password = "secure_password_123!"
    yield {
        "email": email,
        "password": password,
        "full_name": "Test Teacher Sub",
        "user_type": "teacher",
    }
    async with AsyncSessionLocal() as session:
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
            await session.commit()


@pytest_asyncio.fixture(loop_scope="session")
async def student_credentials_sub():
    email = f"student_sub_{uuid.uuid4()}@example.com"
    password = "secure_password_123!"
    yield {
        "email": email,
        "password": password,
        "full_name": "Test Student Sub",
        "user_type": "student",
    }
    async with AsyncSessionLocal() as session:
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
            await session.commit()


@pytest_asyncio.fixture(loop_scope="session")
async def teacher_auth_headers_sub(teacher_credentials_sub):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        await ac.post("/api/auth/signup", json=teacher_credentials_sub)
        response = await ac.post(
            "/api/auth/login",
            data={
                "username": teacher_credentials_sub["email"],
                "password": teacher_credentials_sub["password"],
            },
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(loop_scope="session")
async def student_auth_headers_sub(student_credentials_sub):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        await ac.post("/api/auth/signup", json=student_credentials_sub)
        response = await ac.post(
            "/api/auth/login",
            data={
                "username": student_credentials_sub["email"],
                "password": student_credentials_sub["password"],
            },
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(loop_scope="session", scope="function")
async def sample_paper(teacher_auth_headers_sub):
    payload = {
        "title": "Submissions Test Paper",
        "start_date": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "duration_minutes": 120,
        "is_published": True,
        "questions": [
            {
                "question_text": "What is the capital of France?",
                "model_answer": "Paris",
                "rubric": "1 mark for Paris",
                "marks_assigned": 1.0,
                "sort_order": 1,
            },
            {
                "question_text": "What is 5 + 5?",
                "model_answer": "10",
                "rubric": "1 mark for 10",
                "marks_assigned": 1.0,
                "sort_order": 2,
            },
        ],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/papers/",
            json=payload,
            headers=teacher_auth_headers_sub,
        )
        paper_data = response.json()
        yield paper_data

        # Clean up
        await ac.delete(
            f"/api/papers/{paper_data['qpid']}",
            headers=teacher_auth_headers_sub,
        )


@pytest.mark.asyncio(loop_scope="session")
async def test_create_submission_success(student_auth_headers_sub, sample_paper):
    qpid = sample_paper["qpid"]
    q1_id = sample_paper["questions"][0]["qid"]
    q2_id = sample_paper["questions"][1]["qid"]

    payload = {
        "answers": [
            {"qid": q1_id, "student_answer": "Paris"},
            {"qid": q2_id, "student_answer": "10"},
        ]
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            f"/api/submissions/{qpid}",
            json=payload,
            headers=student_auth_headers_sub,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["qpid"] == qpid
        assert len(data["answers"]) == 2
        assert data["evaluated"] == False
        assert float(data["total_marks_obtained"]) == 0.0


@pytest.mark.asyncio(loop_scope="session")
async def test_create_submission_as_teacher_fails(
    teacher_auth_headers_sub, sample_paper
):
    qpid = sample_paper["qpid"]
    q1_id = sample_paper["questions"][0]["qid"]

    payload = {
        "answers": [
            {"qid": q1_id, "student_answer": "Paris"},
        ]
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            f"/api/submissions/{qpid}",
            json=payload,
            headers=teacher_auth_headers_sub,
        )
        # Teachers should not be able to submit answers
        assert response.status_code == 403


@pytest.mark.asyncio(loop_scope="session")
async def test_create_submission_duplicate_fails(
    student_auth_headers_sub, sample_paper
):
    qpid = sample_paper["qpid"]
    q1_id = sample_paper["questions"][0]["qid"]

    payload = {
        "answers": [
            {"qid": q1_id, "student_answer": "First Answer"},
        ]
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Initial create
        await ac.post(
            f"/api/submissions/{qpid}",
            json=payload,
            headers=student_auth_headers_sub,
        )

        payload_duplicate = {
            "answers": [
                {"qid": q1_id, "student_answer": "Duplicate Answer"},
            ]
        }

        # Try to duplicate
        response = await ac.post(
            f"/api/submissions/{qpid}",
            json=payload_duplicate,
            headers=student_auth_headers_sub,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio(loop_scope="session")
async def test_get_submissions_for_paper_student(
    student_auth_headers_sub, sample_paper
):
    qpid = sample_paper["qpid"]
    q1_id = sample_paper["questions"][0]["qid"]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Insert one
        await ac.post(
            f"/api/submissions/{qpid}",
            json={"answers": [{"qid": q1_id, "student_answer": "My Answer"}]},
            headers=student_auth_headers_sub,
        )

        response = await ac.get(
            f"/api/submissions/{qpid}",
            headers=student_auth_headers_sub,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["qpid"] == qpid


@pytest.mark.asyncio(loop_scope="session")
async def test_get_submissions_for_paper_teacher(
    teacher_auth_headers_sub, student_auth_headers_sub, sample_paper
):
    qpid = sample_paper["qpid"]
    q1_id = sample_paper["questions"][0]["qid"]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Student creates the sub
        await ac.post(
            f"/api/submissions/{qpid}",
            json={"answers": [{"qid": q1_id, "student_answer": "Student Output"}]},
            headers=student_auth_headers_sub,
        )

        response = await ac.get(
            f"/api/submissions/{qpid}",
            headers=teacher_auth_headers_sub,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["qpid"] == qpid
        assert "s_email" in data[0]


@pytest.mark.asyncio(loop_scope="session")
async def test_delete_submission(
    student_auth_headers_sub, student_credentials_sub, sample_paper
):
    qpid = sample_paper["qpid"]
    s_email = student_credentials_sub["email"]
    q1_id = sample_paper["questions"][0]["qid"]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Need to create it first so we can test the delete
        await ac.post(
            f"/api/submissions/{qpid}",
            json={"answers": [{"qid": q1_id, "student_answer": "To Be Deleted"}]},
            headers=student_auth_headers_sub,
        )

        response = await ac.delete(
            f"/api/submissions/{qpid}/{s_email}",
            headers=student_auth_headers_sub,
        )

        assert response.status_code == 204

        # Try to fetch, should be 404
        response_get = await ac.get(
            f"/api/submissions/{qpid}/{s_email}",
            headers=student_auth_headers_sub,
        )
        assert response_get.status_code == 404
