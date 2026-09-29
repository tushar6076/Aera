from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeviceResponse(BaseModel):
    id: str
    name: str
    owner_id: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClaimDeviceRequest(BaseModel):
    device_id: str
    name: str | None = "My AQI Monitor"