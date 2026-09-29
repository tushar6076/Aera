from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReadingBase(BaseModel):
    pm2_5: float
    pm10: float
    temperature: float | None = None
    humidity: float | None = None


class ReadingCreate(ReadingBase):
    device_id: str


class ReadingResponse(ReadingBase):
    id: int
    device_id: str
    aqi: int
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    device_id: str
    aqi: int
    category: str
    recommendation: str