import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.core.config import settings
from app.services.device import device_manager, process_telemetry

device_router = APIRouter()


@device_router.websocket("/ws/{device_id}")
async def esp32_telemetry_endpoint(websocket: WebSocket, device_id: str):
    auth_key = websocket.query_params.get("key")
    if auth_key != settings.DEVICE_PRESHARED_KEY:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await device_manager.register_device(device_id, websocket)
    try:
        while True:
            raw_msg = await websocket.receive_text()
            payload = json.loads(raw_msg)

            enriched = await process_telemetry(device_id, payload)
            if enriched:
                # Stream immediately to React (web) & React Native (app)
                await device_manager.broadcast_telemetry(device_id, enriched)

                # Send fast ACK + buzzer command back to ESP32
                await websocket.send_json({
                    "status": "ok",
                    "buzzer": enriched["buzzer_alert"],
                    "aqi": enriched["aqi"]
                })

    except WebSocketDisconnect:
        device_manager.unregister_device(device_id)
    except Exception:
        device_manager.unregister_device(device_id)
        await websocket.close()