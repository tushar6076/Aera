from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import CredentialsException
from app.db.models.user import User
from app.db.models.device import Device
from app.schemas.user import UserResponse, UserUpdate, DeviceResponse, ClaimDeviceRequest

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "access":
            raise CredentialsException()
    except (JWTError, ValueError):
        raise CredentialsException()

    user = await db.get(User, int(user_id))
    if not user or not user.is_active:
        raise CredentialsException(detail="Inactive or non-existent user")
    return user


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
            raise HTTPException(status_code=400, detail="Email already taken.")
        current_user.email = payload.email

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/devices", response_model=List[DeviceResponse])
async def list_user_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.owner_id == current_user.id))
    return result.scalars().all()


@router.post("/claim-device", response_model=DeviceResponse)
async def claim_device(
    payload: ClaimDeviceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    device = await db.get(Device, payload.device_id)
    if not device:
        device = Device(id=payload.device_id, name=payload.name or "Aera Node", owner_id=current_user.id)
        db.add(device)
    else:
        # Return 409 Conflict if claimed by another user
        if device.owner_id and device.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Device is already claimed by another user."
            )
        device.owner_id = current_user.id
        if payload.name:
            device.name = payload.name

    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def release_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    device = await db.get(Device, device_id)
    if not device or device.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found in your account."
        )

    device.owner_id = None
    await db.commit()
    return None