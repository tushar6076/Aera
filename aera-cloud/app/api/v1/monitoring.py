from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.core.database import get_db
from app.db.models.reading import Reading
from app.schemas.monitoring import ReadingResponse, RecommendationResponse
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


@router.get("/recommendation/{device_id}", response_model=RecommendationResponse)
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
        raise HTTPException(status_code=404, detail="No telemetry available to provide recommendations.")

    advice = await generate_aqi_precaution(
        aqi=record.aqi,
        category=record.category,
        temperature=record.temperature,
        humidity=record.humidity,
    )

    return {
        "device_id": device_id,
        "aqi": record.aqi,
        "category": record.category,
        "recommendation": advice
    }