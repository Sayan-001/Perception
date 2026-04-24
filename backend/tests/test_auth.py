import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

from app.database import AsyncSessionLocal
from app.auth.model import AppUser, Association
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


@pytest_asyncio.fixture(loop_scope="session")
async def teacher_email():
    email = f"teacher_{uuid.uuid4()}@example.com"
    yield email

    async with AsyncSessionLocal() as session:
        await session.execute(delete(Association).where(Association.t_email == email))
        await session.execute(delete(Association).where(Association.s_email == email))
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
        await session.commit()


@pytest_asyncio.fixture(loop_scope="session")
async def student_email():
    email = f"student_{uuid.uuid4()}@example.com"
    yield email

    async with AsyncSessionLocal() as session:
        await session.execute(delete(Association).where(Association.t_email == email))
        await session.execute(delete(Association).where(Association.s_email == email))
        user = await session.get(AppUser, email)
        if user:
            await session.delete(user)
        await session.commit()


@pytest.mark.asyncio(loop_scope="session")
async def test_create_association_success(teacher_email, student_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": teacher_email,
                "password": test_password,
                "full_name": "Teacher User",
                "user_type": "teacher",
            },
        )

        await ac.post(
            "/auth/signup",
            json={
                "email": student_email,
                "password": test_password,
                "full_name": "Student User",
                "user_type": "student",
            },
        )

        login_response = await ac.post(
            "/auth/login",
            data={
                "username": teacher_email,
                "password": test_password,
            },
        )
        teacher_token = login_response.json()["access_token"]

        response = await ac.post(
            "/auth/associations",
            params={"s_email": student_email},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 200


@pytest.mark.asyncio(loop_scope="session")
async def test_create_association_student_cannot_create(
    teacher_email, student_email, test_password
):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": teacher_email,
                "password": test_password,
                "full_name": "Teacher",
                "user_type": "teacher",
            },
        )

        await ac.post(
            "/auth/signup",
            json={
                "email": student_email,
                "password": test_password,
                "full_name": "Student",
                "user_type": "student",
            },
        )

        login_response = await ac.post(
            "/auth/login",
            data={
                "username": student_email,
                "password": test_password,
            },
        )
        student_token = login_response.json()["access_token"]

        response = await ac.post(
            "/auth/associations",
            params={"s_email": student_email},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 403


@pytest.mark.asyncio(loop_scope="session")
async def test_create_association_nonexistent_student(teacher_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": teacher_email,
                "password": test_password,
                "full_name": "Teacher",
                "user_type": "teacher",
            },
        )

        login_response = await ac.post(
            "/auth/login",
            data={
                "username": teacher_email,
                "password": test_password,
            },
        )
        teacher_token = login_response.json()["access_token"]

        response = await ac.post(
            "/auth/associations",
            params={"s_email": f"nonexistent_{uuid.uuid4()}@example.com"},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Student not found"


@pytest.mark.asyncio(loop_scope="session")
async def test_create_association_with_non_student(teacher_email, test_password):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        teacher2_email = f"teacher2_{uuid.uuid4()}@example.com"

        await ac.post(
            "/auth/signup",
            json={
                "email": teacher_email,
                "password": test_password,
                "full_name": "Teacher 1",
                "user_type": "teacher",
            },
        )

        await ac.post(
            "/auth/signup",
            json={
                "email": teacher2_email,
                "password": test_password,
                "full_name": "Teacher 2",
                "user_type": "teacher",
            },
        )

        login_response = await ac.post(
            "/auth/login",
            data={
                "username": teacher_email,
                "password": test_password,
            },
        )
        teacher_token = login_response.json()["access_token"]

        response = await ac.post(
            "/auth/associations",
            params={"s_email": teacher2_email},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Student not found"

        async with AsyncSessionLocal() as session:
            await session.execute(
                delete(Association).where(Association.t_email == teacher2_email)
            )
            await session.execute(
                delete(Association).where(Association.s_email == teacher2_email)
            )
            user = await session.get(AppUser, teacher2_email)
            if user:
                await session.delete(user)
            await session.commit()


@pytest.mark.asyncio(loop_scope="session")
async def test_get_associations_teacher_view(
    teacher_email, student_email, test_password
):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": teacher_email,
                "password": test_password,
                "full_name": "Teacher",
                "user_type": "teacher",
            },
        )

        await ac.post(
            "/auth/signup",
            json={
                "email": student_email,
                "password": test_password,
                "full_name": "Student",
                "user_type": "student",
            },
        )

        login_response = await ac.post(
            "/auth/login",
            data={
                "username": teacher_email,
                "password": test_password,
            },
        )
        teacher_token = login_response.json()["access_token"]

        await ac.post(
            "/auth/associations",
            params={"s_email": student_email},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )

        response = await ac.get(
            "/auth/associations",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "associations" in data
        assert student_email in data["associations"]


@pytest.mark.asyncio(loop_scope="session")
async def test_get_associations_student_view(
    teacher_email, student_email, test_password
):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test/api"
    ) as ac:
        await ac.post(
            "/auth/signup",
            json={
                "email": teacher_email,
                "password": test_password,
                "full_name": "Teacher",
                "user_type": "teacher",
            },
        )

        await ac.post(
            "/auth/signup",
            json={
                "email": student_email,
                "password": test_password,
                "full_name": "Student",
                "user_type": "student",
            },
        )

        teacher_login = await ac.post(
            "/auth/login",
            data={
                "username": teacher_email,
                "password": test_password,
            },
        )
        teacher_token = teacher_login.json()["access_token"]

        await ac.post(
            "/auth/associations",
            params={"s_email": student_email},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )

        student_login = await ac.post(
            "/auth/login",
            data={
                "username": student_email,
                "password": test_password,
            },
        )
        student_token = student_login.json()["access_token"]

        response = await ac.get(
            "/auth/associations",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "associations" in data
        assert teacher_email in data["associations"]
