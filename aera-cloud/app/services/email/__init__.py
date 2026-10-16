from app.services.email.client import send_mail
from app.services.email.templates import (
    render_device_registered_email,
    render_device_removed_email,
    render_login_alert_email,
    render_password_changed_email,
    render_password_reset_email,
    render_welcome_email,
)

__all__ = [
    "send_mail",
    "render_device_registered_email",
    "render_device_removed_email",
    "render_login_alert_email",
    "render_password_changed_email",
    "render_password_reset_email",
    "render_welcome_email",
]