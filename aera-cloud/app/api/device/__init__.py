# app/api/device/__init__.py

from app.api.device.telemetry import device_router
from app.api.device.dependencies import verify_device_http_auth, verify_device_ws_auth

__all__ = ["device_router", "verify_device_http_auth", "verify_device_ws_auth"]