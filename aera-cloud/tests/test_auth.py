import pytest
from httpx import AsyncClient
from app.core.security import create_password_reset_token

pytestmark = pytest.mark.asyncio

AUTH_URL = "/api/v1/auth"


async def test_register_and_login_flow(client: AsyncClient):
    email = "pilot@hacksmiths.dev"
    password = "StrongPassword123!"

    # 1. Register
    reg_res = await client.post(
        f"{AUTH_URL}/register",
        json={"email": email, "password": password, "full_name": "Pilot User"},
    )
    assert reg_res.status_code == 201

    # 2. Login
    login_res = await client.post(
        f"{AUTH_URL}/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"


async def test_register_duplicate_email_conflict(client: AsyncClient):
    payload = {
        "email": "duplicate@hacksmiths.dev",
        "password": "Password123!",
        "full_name": "First User",
    }
    await client.post(f"{AUTH_URL}/register", json=payload)
    dup_res = await client.post(f"{AUTH_URL}/register", json=payload)
    assert dup_res.status_code == 400


async def test_login_invalid_password(client: AsyncClient):
    email = "auth_fail@hacksmiths.dev"
    await client.post(
        f"{AUTH_URL}/register",
        json={"email": email, "password": "CorrectPassword123!", "full_name": "Test"},
    )

    res = await client.post(
        f"{AUTH_URL}/login",
        json={"email": email, "password": "WrongPassword999!"},
    )
    assert res.status_code == 401


async def test_forgot_and_reset_password_flow(client: AsyncClient):
    email = "reset_user@hacksmiths.dev"
    old_pw = "OldPassword123!"
    new_pw = "BrandNewSafePassword456!"

    # Register
    await client.post(
        f"{AUTH_URL}/register",
        json={"email": email, "password": old_pw, "full_name": "Reset User"},
    )

    # Forgot password request (always returns 200 to prevent email enumeration)
    forgot_res = await client.post(
        f"{AUTH_URL}/forgot-password",
        json={"email": email},
    )
    assert forgot_res.status_code == 200

    # Generate test signed token directly
    token = create_password_reset_token(email)

    # Reset password
    reset_res = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"token": token, "new_password": new_pw},
    )
    assert reset_res.status_code == 200

    # Verify old password fails and new password authenticates
    fail_login = await client.post(f"{AUTH_URL}/login", json={"email": email, "password": old_pw})
    assert fail_login.status_code == 401

    success_login = await client.post(f"{AUTH_URL}/login", json={"email": email, "password": new_pw})
    assert success_login.status_code == 200