from app.core.config import settings


def render_password_reset_email(reset_token: str) -> str:
    """Renders clean responsive HTML for password reset emails."""
    reset_url = f"{settings.WEB_BASE_URL}/reset-password?token={reset_token}"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #0284c7; font-size: 24px; font-weight: 700; margin: 0;">Aera</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Real-time Air Quality Intelligence</p>
    </div>

    <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Reset Your Password</h2>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      We received a request to reset the password for your Aera account. Click the button below to choose a new password:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{reset_url}" 
         style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
        Reset Password
      </a>
    </div>

    <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0;">
      This password reset link will expire in <strong>15 minutes</strong>. If you did not request a password change, please ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
      Aera by HackSmiths · <a href="https://hacksmiths.dev" style="color: #0284c7; text-decoration: none;">hacksmiths.dev</a>
    </p>
  </div>
</body>
</html>"""