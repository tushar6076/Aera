from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, get_redis_client
from app.db.models.user import User
from app.db.models.device import Device
from app.schemas.user import UserResponse, UserUpdate
from app.api.v1.deps import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# User Profile Endpoints
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.email is not None and payload.email != current_user.email:
        existing = await db.execute(select(User).where(User.email == payload.email))
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken by another account."
            )
        current_user.email = payload.email

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently destroys the user account. Unlinks all owned hardware nodes
    and flags them as unclaimed in Redis before deleting the user record.
    """
    redis = get_redis_client()

    # 1. Release all claimed devices owned by this user
    devices_result = await db.execute(select(Device).where(Device.owner_id == current_user.id))
    user_devices = devices_result.scalars().all()

    for dev in user_devices:
        dev.owner_id = None
        dev.claimed_at = None
        if redis:
            try:
                await redis.set(f"device:{dev.id}:unclaimed", "true", ex=900)
            except Exception:
                pass

    # 2. Invalidate ambient snapshots stored in Redis
    if redis:
        try:
            await redis.delete(f"ambient:user:{current_user.id}:latest")
        except Exception:
            pass

    # 3. Delete user account record
    await db.delete(current_user)
    await db.commit()

    return None