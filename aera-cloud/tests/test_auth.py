import pytest
from httpx import AsyncClient
from app.core.security import create_password_reset_token

pytestmark = pytest.mark.asyncio


async def test_register_user_success(client: AsyncClient):
    payload = {
        "email": "tester@hacksmiths.dev",
        "password": "SecurePassword123!",
        "full_name": "Test Engineer",
    }
    response = await client.post("/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_register_duplicate_email_fails(client: AsyncClient):
    payload = {
        "email": "duplicate@hacksmiths.dev",
        "password": "Password123!",
        "full_name": "First User",
    }
    # First registration
    res1 = await client.post("/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Duplicate registration
    res2 = await client.post("/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"].lower()


async def test_login_success(client: AsyncClient):
    # Setup user
    await client.post(
        "/v1/auth/register",
        json={"email": "loginuser@hacksmiths.dev", "password": "Password123!"},
    )

    # Login
    response = await client.post(
        "/v1/auth/login",
        json={"email": "loginuser@hacksmiths.dev", "password": "Password123!"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/v1/auth/login",
        json={"email": "nonexistent@hacksmiths.dev", "password": "WrongPassword"},
    )
    assert response.status_code == 401


async def test_forgot_password_generic_response(client: AsyncClient):
    # Should always return 200 without leaking if email exists
    response = await client.post(
        "/v1/auth/forgot-password",
        json={"email": "anyone@hacksmiths.dev"},
    )
    assert response.status_code == 200
    assert "dispatched" in response.json()["message"]


async def test_reset_password_with_valid_token(client: AsyncClient):
    email = "resetme@hacksmiths.dev"
    await client.post(
        "/v1/auth/register",
        json={"email": email, "password": "InitialPassword123"},
    )

    token = create_password_reset_token(email)
    response = await client.post(
        "/v1/auth/reset-password",
        json={"token": token, "new_password": "NewUpdatedPassword123!"},
    )
    assert response.status_code == 200

    # Verify old password no longer works
    old_login = await client.post(
        "/v1/auth/login",
        json={"email": email, "password": "InitialPassword123"},
    )
    assert old_login.status_code == 401

    # Verify new password works
    new_login = await client.post(
        "/v1/auth/login",
        json={"email": email, "password": "NewUpdatedPassword123!"},
    )
    assert new_login.status_code == 200