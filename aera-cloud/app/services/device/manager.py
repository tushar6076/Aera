# app/services/device/manager.py

from typing import Dict, Set
from fastapi import WebSocket
from app.core import logger, get_redis_client

class DeviceConnectionManager:
    """Manages active WebSockets for ESP32 nodes and mobile/web client subscribers."""

    def __init__(self):
        # Maps device_id -> active ESP32 WebSocket
        self.active_devices: Dict[str, WebSocket] = {}
        # Maps device_id -> Set of consumer WebSockets (React Native / Web)
        self.subscribers: Dict[str, Set[WebSocket]] = {}

    async def register_device(self, device_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.active_devices[device_id] = ws
        logger.info(f"Hardware node '{device_id}' connected to telemetry socket.")

    def unregister_device(self, device_id: str) -> None:
        if device_id in self.active_devices:
            del self.active_devices[device_id]
            logger.info(f"Hardware node '{device_id}' disconnected.")

    async def register_subscriber(self, device_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if device_id not in self.subscribers:
            self.subscribers[device_id] = set()
        self.subscribers[device_id].add(ws)

        # Hydrate subscriber instantly from Redis cache if available
        redis = get_redis_client()
        if redis:
            try:
                cached = await redis.get(f"device:{device_id}:latest")
                if cached:
                    await ws.send_text(cached)
            except Exception as e:
                logger.debug(f"Immediate hydration skipped for {device_id}: {e}")

    def unregister_subscriber(self, device_id: str, ws: WebSocket) -> None:
        if device_id in self.subscribers:
            self.subscribers[device_id].discard(ws)
            if not self.subscribers[device_id]:
                del self.subscribers[device_id]

    async def broadcast_telemetry(self, device_id: str, payload: dict) -> None:
        """Broadcasts enriched telemetry packets to all active client viewers."""
        listeners = self.subscribers.get(device_id, set())
        if not listeners:
            return

        dead_connections = set()
        for ws in listeners:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_connections.add(ws)

        if dead_connections:
            self.subscribers[device_id] -= dead_connections

device_manager = DeviceConnectionManager()