from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.db.models.reading import Reading
from app.schemas.monitoring import (
    ReadingResponse,
    RecommendationResponse,
    AmbientTelemetryPayload,
    StructuredRecommendation,
)
from app.services.device import device_manager
from app.services.ai.recommendation import generate_aqi_precaution

router = APIRouter()


@router.websocket("/ws/live/{device_id}")
async def live_dashboard_stream(websocket: WebSocket, device_id: str):
    await device_manager.register_subscriber(device_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        device_manager.unregister_subscriber(device_id, websocket)


@router.get("/latest/{device_id}", response_model=ReadingResponse)
async def get_latest_device_reading(device_id: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Reading)
        .where(Reading.device_id == device_id)
        .order_by(desc(Reading.created_at))
        .limit(1)
    )
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="No readings found for this device.")
    return record


@router.get("/history/{device_id}", response_model=List[ReadingResponse])
async def get_device_history(device_id: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    query = (
        select(Reading)
        .where(Reading.device_id == device_id)
        .order_by(desc(Reading.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    return list(reversed(result.scalars().all()))


@router.get("/recommendation/device/{device_id}", response_model=RecommendationResponse)
async def get_device_recommendation(device_id: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Reading)
        .where(Reading.device_id == device_id)
        .order_by(desc(Reading.created_at))
        .limit(1)
    )
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="No telemetry available for this device.")

    advice = await generate_aqi_precaution(
        aqi=record.aqi,
        category=record.category,
        temperature=record.temperature,
        humidity=record.humidity,
        pm2_5=record.pm2_5,
        pm10=record.pm10,
        source=f"ESP32 Node ({device_id})",
    )

    return RecommendationResponse(device_id=device_id, data=advice)


@router.post("/recommendation/ambient", response_model=RecommendationResponse)
async def get_ambient_recommendation(payload: AmbientTelemetryPayload):
    advice = await generate_aqi_precaution(
        temperature=payload.temperature,
        humidity=payload.humidity,
        pm2_5=payload.pm2_5,
        pm10=payload.pm10,
        co=payload.co,
        source=payload.source or "Ambient Grid",
    )

    return RecommendationResponse(device_id=None, data=advice)