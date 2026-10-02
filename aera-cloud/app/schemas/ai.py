# app/schemas/ai.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AmbientContext(BaseModel):
    location_name: Optional[str] = "Outdoor"
    aqi: Optional[int] = None
    category: Optional[str] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    co: Optional[float] = None


class ChatMessageItem(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    device_id: Optional[str] = None
    ambient_context: Optional[AmbientContext] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    device_id: Optional[str] = None
    telemetry_injected: bool
    created_at: datetime