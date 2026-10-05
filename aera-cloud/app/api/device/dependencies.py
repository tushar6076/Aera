from typing import Optional
from fastapi import Header, HTTPException, Query, WebSocket, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db, get_redis_client
from app.db.models.device import Device, DeviceVisibility


async def verify_device_http_auth(
    authorization: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None, alias="X-Device-ID"),
    db: AsyncSession = Depends(get_db),
) -> Device:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header.",
        )

    token = authorization.split("Bearer ")[1].strip()
    if token != settings.DEVICE_PRESHARED_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid hardware authentication credentials.",
        )

    if not x_device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required X-Device-ID header.",
        )

    clean_device_id = x_device_id.strip().upper()

    # Fetch or auto-register hardware node in Postgres
    result = await db.execute(select(Device).where(Device.id == clean_device_id))
    device = result.scalars().first()

    if not device:
        device = Device(
            id=clean_device_id,
            name=f"Node {clean_device_id[-6:] if len(clean_device_id) >= 6 else clean_device_id}",
            visibility=DeviceVisibility.PUBLIC,
            is_active=True,
            owner_id=None,
        )
        db.add(device)
        await db.commit()
        await db.refresh(device)

    # Keep unclaimed node visible in discovery cache
    if device.owner_id is None:
        redis = get_redis_client()
        if redis:
            try:
                await redis.set(f"device:{clean_device_id}:unclaimed", "true", ex=900)
            except Exception:
                pass

    return device


async def verify_device_ws_auth(
    websocket: WebSocket,
    device_id: str,
    key: Optional[str] = Query(None),
) -> Optional[str]:
    """
    Validates pre-shared key for raw WebSocket connections.
    Closes the connection immediately if unauthorized.
    """
    if key != settings.DEVICE_PRESHARED_KEY:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    return device_id.strip().upper()