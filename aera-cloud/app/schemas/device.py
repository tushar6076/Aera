# app/schemas/device.py

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DeviceVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"


# --- Ingest Schemas (ESP32 -> Cloud) ---

class TelemetryIngestPayload(BaseModel):
    device_id: str = Field(..., description="Unique hardware identifier derived from MAC, e.g. AERA-B21A80")
    temperature: float = Field(..., ge=-40.0, le=85.0)
    humidity: float = Field(..., ge=0.0, le=100.0)
    co: float = Field(..., ge=0.0, description="CO concentration in PPM from MQ9")
    pm25: Optional[float] = Field(None, ge=0.0)
    pm10: Optional[float] = Field(None, ge=0.0)


class IngestAckResponse(BaseModel):
    status: str = "ok"
    buzzer: bool = False
    aqi: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Management & Claim Schemas (App -> Cloud) ---

class DeviceClaimRequest(BaseModel):
    device_id: str = Field(..., min_length=4, max_length=32)
    name: Optional[str] = Field("My Aera Node", max_length=64)
    visibility: Optional[DeviceVisibility] = DeviceVisibility.PRIVATE


class DeviceResponse(BaseModel):
    id: str
    name: str
    owner_id: Optional[str] = None
    visibility: DeviceVisibility
    is_active: bool
    claimed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True