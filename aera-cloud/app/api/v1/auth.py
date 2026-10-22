import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.db.models.user import User
from app.db.models.password_reset_code import PasswordResetCode
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.services.email import (
    send_mail,
    render_login_alert_email,
    render_password_changed_email,
    render_password_reset_email,
    render_welcome_email,
)

router = APIRouter()
MAX_RESET_CODE_ATTEMPTS = 5
RESET_CODE_TTL = timedelta(minutes=15)


def _hash_reset_code(email: str, code: str) -> str:
    message = f"{email.lower()}:{code}".encode()
    return hmac.new(
        # Include the application secret so a database leak does not expose active codes.
        settings.SECRET_KEY.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already registered."
        )

    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    await send_mail(
        to_email=new_user.email,
        subject="Welcome to Aera",
        html_body=render_welcome_email(new_user.full_name),
    )

    token = create_access_token(subject=str(new_user.id))
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login_user(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    await send_mail(
        to_email=user.email,
        subject="Aera - New sign-in",
        html_body=render_login_alert_email(user.full_name),
    )

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Sends an expiring one-time verification code via email.
    Always returns 200 OK even if the email doesn't exist to prevent email enumeration.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if user:
        code = f"{secrets.randbelow(1_000_000):06d}"
        reset_result = await db.execute(
            select(PasswordResetCode).where(PasswordResetCode.user_id == user.id)
        )
        reset_record = reset_result.scalars().first()
        if reset_record:
            reset_record.code_hash = _hash_reset_code(user.email, code)
            reset_record.expires_at = datetime.now(timezone.utc) + RESET_CODE_TTL
            reset_record.attempts = 0
        else:
            db.add(
                PasswordResetCode(
                    user_id=user.id,
                    code_hash=_hash_reset_code(user.email, code),
                    expires_at=datetime.now(timezone.utc) + RESET_CODE_TTL,
                    attempts=0,
                )
            )
        await db.commit()

        await send_mail(
            to_email=user.email,
            subject="Aera - Reset Your Password",
            html_body=render_password_reset_email(reset_code=code),
        )

    return {
        "message": "If an account with that email exists, a verification code has been sent."
    }


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Validates a one-time email code and updates the user's password."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or has expired."
        )

    code_result = await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.user_id == user.id)
        .with_for_update()
    )
    reset_record = code_result.scalars().first()
    if not reset_record or reset_record.expires_at <= datetime.now(timezone.utc):
        if reset_record:
            await db.delete(reset_record)
            await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or has expired."
        )

    if reset_record.attempts >= MAX_RESET_CODE_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or has expired."
        )

    expected_hash = _hash_reset_code(user.email, payload.code)
    if not hmac.compare_digest(expected_hash, reset_record.code_hash):
        reset_record.attempts += 1
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or has expired."
        )

    user.hashed_password = get_password_hash(payload.new_password)
    await db.delete(reset_record)
    await db.commit()

    await send_mail(
        to_email=user.email,
        subject="Aera - Password changed",
        html_body=render_password_changed_email(user.full_name),
    )

    return {"message": "Password reset successfully. You can now log in with your new credentials."}