import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
from app.core.logging import logger


def _send_sync_email(to_email: str, subject: str, html_body: str) -> bool:
    """Synchronous worker that connects to Titan Mail via SMTP_SSL."""
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        logger.warning("Titan Mail credentials missing in configuration. Email skipped.")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=12) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, [to_email], msg.as_string())
        logger.info(f"Email successfully delivered to {to_email} via Titan Mail.")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_mail(to_email: str, subject: str, html_body: str) -> bool:
    """Asynchronous non-blocking wrapper running SMTP delivery on an executor."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _send_sync_email, to_email, subject, html_body)