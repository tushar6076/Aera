from app.schemas.auth import UserRegister, UserLogin, Token, ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
from app.schemas.user import UserResponse, UserUpdate, DeviceResponse, ClaimDeviceRequest
from app.schemas.monitoring import ReadingResponse, RecommendationResponse

__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "MessageResponse",
    "UserResponse",
    "UserUpdate",
    "DeviceResponse",
    "ClaimDeviceRequest",
    "ReadingResponse",
    "RecommendationResponse",
]