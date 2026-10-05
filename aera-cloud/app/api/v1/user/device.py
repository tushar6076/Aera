# aera-cloud/app/api/v1/user/device.py

import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, get_redis_client
from app.db.models.user import User
from app.db.models.device import Device, DeviceVisibility
from app.schemas.user import DeviceResponse, ClaimDeviceRequest
from app.api.v1.deps import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Device Discovery & Tenancy Endpoints
# ---------------------------------------------------------------------------
@router.get("/devices/unclaimed", response_model=List[str])
async def list_unclaimed_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns detected hardware nodes broadcasting telemetry that have not
    yet been claimed by any user.
    """
    redis = get_redis_client()
    if redis:
        try:
            keys = await redis.keys("device:*:unclaimed")
            return [k.split(":")[1] for k in keys]
        except Exception:
            pass

    stmt = select(Device.id).where(Device.owner_id.is_(None)).limit(20)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/devices", response_model=List[DeviceResponse])
async def list_user_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all devices claimed by the authenticated user."""
    result = await db.execute(select(Device).where(Device.owner_id == current_user.id))
    return result.scalars().all()


@router.post("/claim-device", response_model=DeviceResponse)
async def claim_device(
    payload: ClaimDeviceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Pairs an ESP32 node to the user's account.
    Prevents claiming if another user is already assigned as owner.
    """
    device = await db.get(Device, payload.device_id)

    if not device:
        device = Device(
            id=payload.device_id,
            name=payload.name or f"Node {payload.device_id[-6:]}",
            owner_id=current_user.id,
            claimed_at=datetime.now(timezone.utc),
        )
        db.add(device)
    else:
        if device.owner_id and device.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Device is already claimed by another user."
            )
        device.owner_id = current_user.id
        device.claimed_at = datetime.now(timezone.utc)
        if payload.name:
            device.name = payload.name

    await db.commit()
    await db.refresh(device)

    # Invalidate unclaimed flag in Redis
    redis = get_redis_client()
    if redis:
        try:
            await redis.delete(f"device:{payload.device_id}:unclaimed")
        except Exception:
            pass

    return device


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def release_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unpairs a node from the account, returning it to an unclaimed state."""
    device = await db.get(Device, device_id)
    if not device or device.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found in your account."
        )

    device.owner_id = None
    device.claimed_at = None
    await db.commit()

    # Mark unclaimed in Redis so other nearby accounts can discover it
    redis = get_redis_client()
    if redis:
        try:
            await redis.set(f"device:{device_id}:unclaimed", "true", ex=900)
        except Exception:
            pass

    return None


@router.get("/devices/{device_id}/live")
async def get_device_live_state(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sub-millisecond read from Redis RAM for real-time telemetry and online/offline heartbeat.
    """
    device = await db.get(Device, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found."
        )

    if device.owner_id != current_user.id and getattr(device, "visibility", None) == DeviceVisibility.PRIVATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: this device is private."
        )

    redis = get_redis_client()
    heartbeat = None
    latest = None

    if redis:
        try:
            heartbeat = await redis.get(f"device:{device_id}:heartbeat")
            raw_latest = await redis.get(f"device:{device_id}:latest")
            if raw_latest:
                latest = json.loads(raw_latest)
        except Exception:
            pass

    return {
        "device_id": device_id,
        "name": device.name,
        "is_online": heartbeat == "online",
        "telemetry": latest,
    }