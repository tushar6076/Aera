# app/v1/monitoring.py

import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status,
)
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db, get_redis_client, logger
from app.db.models.reading import Reading
from app.db.models.device import Device, DeviceVisibility
from app.db.models.user import User
from app.schemas.monitoring import (
    ReadingResponse,
    RecommendationResponse,
    AmbientTelemetryPayload,
    AmbientSnapshotResponse,
)
from app.services.device import device_manager
from app.services.ai.recommendation import generate_aqi_precaution
from app.api.v1.deps import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Real-time WebSocket Stream for App & Web Dashboard
# ---------------------------------------------------------------------------
@router.websocket("/ws/live/{device_id}")
async def live_dashboard_stream(websocket: WebSocket, device_id: str):
    """
    Subscribes client to live broadcast events emitted by DeviceConnectionManager.
    Immediately receives latest Redis state upon connection.
    """
    await device_manager.register_subscriber(device_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        device_manager.unregister_subscriber(device_id, websocket)


# ---------------------------------------------------------------------------
# Latest Telemetry: Redis-First with PostgreSQL Fallback
# ---------------------------------------------------------------------------
@router.get("/latest/{device_id}", response_model=ReadingResponse)
async def get_latest_device_reading(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Retrieves the most recent sensor snapshot.
    Checks Redis hot-cache first (0-1ms latency), falling back to Postgres on cold start.
    """
    # 1. Enforce device privacy boundary
    dev = await db.get(Device, device_id)
    if not dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    if dev.visibility == DeviceVisibility.PRIVATE:
        if not current_user or dev.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private device telemetry.",
            )

    # 2. Attempt Redis RAM retrieval
    redis = get_redis_client()
    if redis:
        try:
            cached_json = await redis.get(f"device:{device_id}:latest")
            if cached_json:
                data = json.loads(cached_json)
                ts_raw = data.get("timestamp")
                ts = (
                    datetime.fromisoformat(ts_raw)
                    if ts_raw
                    else datetime.now(timezone.utc)
                )

                return ReadingResponse(
                    id=0,
                    device_id=device_id,
                    pm2_5=data.get("pm2_5", 0.0),
                    pm10=data.get("pm10", 0.0),
                    co=data.get("co"),
                    temperature=data.get("temperature"),
                    humidity=data.get("humidity"),
                    aqi=data.get("aqi", 0),
                    category=data.get("category", "Moderate"),
                    created_at=ts,
                )
        except Exception as e:
            logger.warning(f"Redis cache lookup failed for device '{device_id}': {e}")

    # 3. Fallback to PostgreSQL
    query = (
        select(Reading)
        .where(Reading.device_id == device_id)
        .order_by(desc(Reading.created_at))
        .limit(1)
    )
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry readings recorded for this device.",
        )
    return record


# ---------------------------------------------------------------------------
# Telemetry Historical Trends for Charts
# ---------------------------------------------------------------------------
@router.get("/history/{device_id}", response_model=List[ReadingResponse])
async def get_device_history(
    device_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Returns chronological telemetry series for client chart visualization."""
    dev = await db.get(Device, device_id)
    if not dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    if dev.visibility == DeviceVisibility.PRIVATE:
        if not current_user or dev.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private device telemetry.",
            )

    query = (
        select(Reading)
        .where(Reading.device_id == device_id)
        .order_by(desc(Reading.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    return list(reversed(result.scalars().all()))


# ---------------------------------------------------------------------------
# Structured AI Precautions & Recommendations
# ---------------------------------------------------------------------------
@router.get("/recommendation/device/{device_id}", response_model=RecommendationResponse)
async def get_device_recommendation(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Generates structured health recommendations grounded in live device readings."""
    dev = await db.get(Device, device_id)
    if not dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    if dev.visibility == DeviceVisibility.PRIVATE:
        if not current_user or dev.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private device telemetry.",
            )

    query = (
        select(Reading)
        .where(Reading.device_id == device_id)
        .order_by(desc(Reading.created_at))
        .limit(1)
    )
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry available for this device.",
        )

    advice = await generate_aqi_precaution(
        aqi=record.aqi,
        category=record.category,
        temperature=record.temperature,
        humidity=record.humidity,
        pm2_5=record.pm2_5,
        pm10=record.pm10,
        co=record.co,
        source=f"ESP32 Node ({device_id})",
    )

    return RecommendationResponse(device_id=device_id, data=advice)


@router.post("/recommendation/ambient", response_model=RecommendationResponse)
async def get_ambient_recommendation(
    payload: AmbientTelemetryPayload,
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates ambient readings, caches the latest atmospheric snapshot
    in Redis under the user session for Groq context injection, and returns structured precautions.
    """
    advice = await generate_aqi_precaution(
        aqi=payload.aqi,
        category=payload.category,
        temperature=payload.temperature,
        humidity=payload.humidity,
        pm2_5=payload.pm2_5,
        pm10=payload.pm10,
        co=payload.co,
        source=payload.source or "Ambient Grid",
    )

    # Cache this ambient snapshot for the user in Redis (1-hour TTL)
    redis = get_redis_client()
    if redis:
        try:
            snapshot = {
                "source": payload.source or "Ambient Grid",
                "aqi": advice.aqi,
                "category": advice.category,
                "pm25": payload.pm2_5,
                "pm10": payload.pm10,
                "temperature": payload.temperature,
                "humidity": payload.humidity,
                "co": payload.co,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await redis.set(
                f"ambient:user:{current_user.id}:latest",
                json.dumps(snapshot),
                ex=3600,
            )
        except Exception as e:
            logger.warning(f"Failed to cache ambient snapshot in Redis: {e}")

    return RecommendationResponse(device_id=None, data=advice)


@router.get("/recommendation/ambient/current", response_model=AmbientSnapshotResponse)
async def get_current_ambient_snapshot(
    current_user: User = Depends(get_current_user),
):
    """Retrieves the active user's cached ambient atmospheric state from Redis."""
    redis = get_redis_client()
    if not redis:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cache backend unavailable.",
        )

    raw_cached = await redis.get(f"ambient:user:{current_user.id}:latest")
    if not raw_cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ambient readings cached for current session.",
        )

    data = json.loads(raw_cached)
    return AmbientSnapshotResponse(
        source=data.get("source", "Ambient Grid"),
        aqi=data.get("aqi", 0),
        category=data.get("category", "Moderate"),
        pm25=data.get("pm25"),
        pm10=data.get("pm10"),
        temperature=data.get("temperature"),
        humidity=data.get("humidity"),
        co=data.get("co"),
        timestamp=datetime.fromisoformat(data["timestamp"]),
    )