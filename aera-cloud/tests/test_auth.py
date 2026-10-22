import re
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.password_reset_code import PasswordResetCode

pytestmark = pytest.mark.asyncio

AUTH_URL = "/api/v1/auth"


async def test_register_and_login_flow(client: AsyncClient, monkeypatch):
    from app.api.v1 import auth as auth_api

    send_mail = AsyncMock(return_value=True)
    monkeypatch.setattr(auth_api, "send_mail", send_mail)
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
    assert [call.kwargs["subject"] for call in send_mail.await_args_list] == [
        "Welcome to Aera",
        "Aera - New sign-in",
    ]


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


async def test_forgot_and_reset_password_flow(client: AsyncClient, monkeypatch):
    from app.api.v1 import auth as auth_api

    send_mail = AsyncMock(return_value=True)
    monkeypatch.setattr(auth_api, "send_mail", send_mail)
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

    code_html = send_mail.await_args_list[1].kwargs["html_body"]
    code = re.search(r"<strong>(\d{6})</strong>", code_html).group(1)
    wrong_code = "000000" if code != "000000" else "000001"

    # A bad code should not consume the valid code's remaining attempts.
    invalid_reset = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"email": email, "code": wrong_code, "new_password": new_pw},
    )
    assert invalid_reset.status_code == 400

    # Reset password using the code delivered in the email.
    reset_res = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"email": email, "code": code, "new_password": new_pw},
    )
    assert reset_res.status_code == 200

    reused_code_res = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"email": email, "code": code, "new_password": old_pw},
    )
    assert reused_code_res.status_code == 400

    # Verify old password fails and new password authenticates
    fail_login = await client.post(f"{AUTH_URL}/login", json={"email": email, "password": old_pw})
    assert fail_login.status_code == 401

    success_login = await client.post(f"{AUTH_URL}/login", json={"email": email, "password": new_pw})
    assert success_login.status_code == 200
    assert [call.kwargs["subject"] for call in send_mail.await_args_list] == [
        "Welcome to Aera",
        "Aera - Reset Your Password",
        "Aera - Password changed",
        "Aera - New sign-in",
    ]


async def test_reset_password_rejects_codes_that_are_not_six_digits(client: AsyncClient):
    response = await client.post(
        f"{AUTH_URL}/reset-password",
        json={
            "email": "reset_length@hacksmiths.dev",
            "code": "12345678",
            "new_password": "NewPassword123!",
        },
    )
    assert response.status_code == 422


async def test_password_reset_code_expires(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    from app.api.v1 import auth as auth_api

    send_mail = AsyncMock(return_value=True)
    monkeypatch.setattr(auth_api, "send_mail", send_mail)
    email = "expired_code@hacksmiths.dev"
    await client.post(
        f"{AUTH_URL}/register",
        json={"email": email, "password": "OldPassword123!"},
    )
    await client.post(f"{AUTH_URL}/forgot-password", json={"email": email})
    code_html = send_mail.await_args_list[1].kwargs["html_body"]
    code = re.search(r"<strong>(\d{6})</strong>", code_html).group(1)

    result = await db_session.execute(select(PasswordResetCode))
    reset_record = result.scalars().first()
    reset_record.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await db_session.commit()

    response = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"email": email, "code": code, "new_password": "NewPassword123!"},
    )
    assert response.status_code == 400


async def test_password_reset_code_attempt_limit_and_reissue(client: AsyncClient, monkeypatch):
    from app.api.v1 import auth as auth_api

    send_mail = AsyncMock(return_value=True)
    monkeypatch.setattr(auth_api, "send_mail", send_mail)
    code_values = iter((100, 101))
    monkeypatch.setattr(auth_api.secrets, "randbelow", lambda _: next(code_values))
    email = "attempts_code@hacksmiths.dev"
    await client.post(
        f"{AUTH_URL}/register",
        json={"email": email, "password": "OldPassword123!"},
    )
    await client.post(f"{AUTH_URL}/forgot-password", json={"email": email})
    old_code = re.search(
        r"<strong>(\d{6})</strong>",
        send_mail.await_args_list[1].kwargs["html_body"],
    ).group(1)
    wrong_code = "000000" if old_code != "000000" else "000001"

    for _ in range(auth_api.MAX_RESET_CODE_ATTEMPTS):
        response = await client.post(
            f"{AUTH_URL}/reset-password",
            json={
                "email": email,
                "code": wrong_code,
                "new_password": "NewPassword123!",
            },
        )
        assert response.status_code == 400

    locked_response = await client.post(
        f"{AUTH_URL}/reset-password",
        json={
            "email": email,
            "code": old_code,
            "new_password": "NewPassword123!",
        },
    )
    assert locked_response.status_code == 400

    await client.post(f"{AUTH_URL}/forgot-password", json={"email": email})
    new_code = re.search(
        r"<strong>(\d{6})</strong>",
        send_mail.await_args_list[-1].kwargs["html_body"],
    ).group(1)
    assert new_code != old_code

    old_code_response = await client.post(
        f"{AUTH_URL}/reset-password",
        json={
            "email": email,
            "code": old_code,
            "new_password": "NewPassword123!",
        },
    )
    assert old_code_response.status_code == 400

    reset_response = await client.post(
        f"{AUTH_URL}/reset-password",
        json={
            "email": email,
            "code": new_code,
            "new_password": "NewPassword123!",
        },
    )
    assert reset_response.status_code == 200