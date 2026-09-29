from fastapi import APIRouter
from app.api.device import device_router
from app.api.v1 import auth, monitoring, user

api_router = APIRouter()

# 1. Hardware Ingestion Gateway: /api/device/...
api_router.include_router(
    device_router,
    prefix="/device",
    tags=["Hardware Telemetry"],
)

# 2. Client-Facing API (Web & Mobile): /api/v1/...
v1_router = APIRouter(prefix="/v1")
v1_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
v1_router.include_router(user.router, prefix="/user", tags=["User"])
v1_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring"])

api_router.include_router(v1_router)