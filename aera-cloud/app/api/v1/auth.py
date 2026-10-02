from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_password_reset_token,  # ensure you export/import this helper
    verify_password_reset_token,
)
from app.db.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.services.email import send_mail, render_password_reset_email

router = APIRouter()


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

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Sends a signed 15-minute reset link via Titan Mail.
    Always returns 200 OK even if the email doesn't exist to prevent email enumeration.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if user:
        # 1. Generate the signed 15-minute token for the email
        reset_token = create_password_reset_token(user.email)
        
        # 2. Render the template synchronously (no await)
        html_body = render_password_reset_email(reset_token=reset_token)
        
        # 3. Dispatch asynchronously via Titan Mail worker
        await send_mail(
            to_email=user.email,
            subject="Aera - Reset Your Password",
            html_body=html_body,
        )

    return {
        "message": "If an account with that email exists, a password reset link has been dispatched."
    }


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Validates the reset token and updates the user's password."""
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The reset link is invalid or has expired."
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Hash and persist new password
    user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()

    return {"message": "Password reset successfully. You can now log in with your new credentials."}