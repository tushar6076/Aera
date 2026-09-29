# Device Service (ESP32 Ingestion & Live WebSockets)
from app.services.device.manager import device_manager
from app.services.device.telemetry import process_telemetry

# Email Service (Titan Mail SMTP)
from app.services.email.client import send_mail
from app.services.email.templates import render_password_reset_email

# AI Service (Groq Health & Lifestyle Precautions)
from app.services.ai.recommendation import generate_aqi_precaution
from app.services.ai.safety import sanitize_recommendation

__all__ = [
    "device_manager",
    "process_telemetry",
    "send_mail",
    "render_password_reset_email",
    "generate_aqi_precaution",
    "sanitize_recommendation",
]