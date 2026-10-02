# app/api/device/telemetry.py

import json
from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Optional
from app.core.database import get_db
from app.core.logging import logger
from app.db.models.device import Device
from app.schemas.device import TelemetryIngestPayload, IngestAckResponse
from app.services.device import device_manager, process_telemetry
from app.api.device.dependencies import verify_device_http_auth, verify_device_ws_auth

device_router = APIRouter()


# ---------------------------------------------------------------------------
# HTTP Telemetry Ingest (Used by your ESP32 postTelemetry routine)
# ---------------------------------------------------------------------------
@device_router.post("/telemetry/ingest", response_model=IngestAckResponse, status_code=status.HTTP_200_OK)
async def ingest_http_telemetry(
    payload: TelemetryIngestPayload,
    device: Device = Depends(verify_device_http_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives periodic telemetry packets from hardware nodes over HTTPS POST.
    Persists data to PostgreSQL and broadcasts live updates to frontend clients.
    """
    # Prefer device.id verified by the header and database lookup
    target_id = device.id

    # 1. Ingest, persist telemetry reading, calculate AQI & thresholds
    data_dict = payload.model_dump()
    data_dict["device_id"] = target_id
    enriched = await process_telemetry(target_id, data_dict, db=db)

    if not enriched:
        return IngestAckResponse(status="error", buzzer=False)

    # 2. Push to connected React Native / Web clients via DeviceManager
    await device_manager.broadcast_telemetry(target_id, enriched)

    # 3. Return immediate acknowledgment and state actions (e.g. buzzer trigger)
    return IngestAckResponse(
        status="ok",
        buzzer=enriched.get("buzzer_alert", False),
        aqi=enriched.get("aqi"),
    )


# ---------------------------------------------------------------------------
# WebSocket Telemetry Ingest (Low-latency bidirectional streaming)
# ---------------------------------------------------------------------------
@device_router.websocket("/ws/{device_id}")
async def esp32_telemetry_ws(
    websocket: WebSocket,
    device_id: str,
    valid_device_id: Optional[str] = Depends(verify_device_ws_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Bidirectional streaming channel for nodes supporting persistent sockets.
    """
    if not valid_device_id:
        return

    await device_manager.register_device(device_id, websocket)
    try:
        while True:
            raw_msg = await websocket.receive_text()
            payload = json.loads(raw_msg)

            enriched = await process_telemetry(device_id, payload, db=db)
            if enriched:
                # Broadcast immediately to frontend clients
                await device_manager.broadcast_telemetry(device_id, enriched)

                # Send instantaneous ACK + buzzer directive back to ESP32
                await websocket.send_json({
                    "status": "ok",
                    "buzzer": enriched.get("buzzer_alert", False),
                    "aqi": enriched.get("aqi"),
                })

    except WebSocketDisconnect:
        device_manager.unregister_device(device_id)
    except Exception as e:
        logger.error(f"WebSocket error on hardware node {device_id}: {e}")
        device_manager.unregister_device(device_id)
        await websocket.close()