"""Email sending via Resend.

All helpers are no-ops when ``settings.resend_api_key`` is empty, so tests and
local development continue to work without email credentials. Callers should
treat the return value as a best-effort boolean.
"""
import logging

from app.config import settings

logger = logging.getLogger("chauka.email")


def send_email(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success, False otherwise."""
    if not settings.resend_api_key:
        logger.info(
            "email disabled (no RESEND_API_KEY); would send to %s: %s", to, subject
        )
        return False
    try:
        import resend

        resend.api_key = settings.resend_api_key
        resend.Emails.send(
            {
                "from": settings.email_from,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def send_password_reset_email(email: str, reset_link: str) -> bool:
    """Send a password reset email with the given link."""
    subject = "Reset your Chauka password"
    html = f"""
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #111;">Reset your password</h1>
      <p style="color: #444; line-height: 1.6;">
        We received a request to reset your Chauka password. Click the link below to set a new one.
        This link expires in 1 hour.
      </p>
      <p style="margin: 24px 0;">
        <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">
          Reset password
        </a>
      </p>
      <p style="color: #777; font-size: 13px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        — Chauka · chauka.org
      </p>
    </div>
    """
    return send_email(email, subject, html)


def send_invitation_email(
    email: str, organisation_name: str, invite_link: str, role: str
) -> bool:
    """Send an invitation email to join an organisation."""
    subject = f"You've been invited to {organisation_name} on Chauka"
    html = f"""
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #111;">You're invited to join {organisation_name}</h1>
      <p style="color: #444; line-height: 1.6;">
        You have been invited to join <strong>{organisation_name}</strong> on Chauka as a <strong>{role}</strong>.
        Click the link below to accept the invitation.
      </p>
      <p style="margin: 24px 0;">
        <a href="{invite_link}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">
          Accept invitation
        </a>
      </p>
      <p style="color: #777; font-size: 13px;">
        If you were not expecting this invitation, you can safely ignore this email.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        — Chauka · chauka.org
      </p>
    </div>
    """
    return send_email(email, subject, html)
