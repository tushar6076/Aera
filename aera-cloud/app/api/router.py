# app/api/router.py

from fastapi import APIRouter
from app.api.device import device_router
from app.api.v1 import auth, monitoring, user, ai

api_router = APIRouter()

# Hardware gateway for ESP32 nodes: /device/telemetry/ingest & /device/ws/{id}
api_router.include_router(
    device_router,
    prefix="/device",
    tags=["Hardware Telemetry"],
)

# Client-facing API: /v1/...
v1_router = APIRouter(prefix="/v1")
v1_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
v1_router.include_router(user.router, prefix="/user", tags=["User & Devices"])
v1_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring"])
v1_router.include_router(ai.router, prefix="/ai", tags=["AI & Intelligence"])

api_router.include_router(v1_router)