from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReadingBase(BaseModel):
    pm2_5: float
    pm10: float
    temperature: float | None = None
    humidity: float | None = None
    co: float | None = None


class ReadingCreate(ReadingBase):
    device_id: str


class ReadingResponse(ReadingBase):
    id: int
    device_id: str
    aqi: int
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AmbientTelemetryPayload(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    pm2_5: float | None = None
    pm10: float | None = None
    co: float | None = None
    source: str = "ambient"


class StructuredRecommendation(BaseModel):
    source: str
    aqi: int
    category: str
    tone: str  # "emerald" | "sky" | "amber" | "rose"
    summary: str
    precautions: list[str]
    vulnerable_groups_warning: str | None = None


class RecommendationResponse(BaseModel):
    device_id: str | None = None
    data: StructuredRecommendation