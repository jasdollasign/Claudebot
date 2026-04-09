"""
Email helper for the booking agent.
Uses Gmail SMTP with an App Password (set via env vars).

Required env vars (store in .env or export before running):
    GMAIL_USER      – the sending Gmail address (NOT fprioai@gmail.com,
                      use a dedicated sender so the mailbox never replies to itself)
    GMAIL_APP_PASS  – 16-character Gmail App Password for GMAIL_USER
    NOTIFY_EMAIL    – destination address (fprioai@gmail.com)
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GMAIL_USER   = os.environ.get("GMAIL_USER", "")
GMAIL_PASS   = os.environ.get("GMAIL_APP_PASS", "")
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", "fprioai@gmail.com")

FOOTER = "\n\n---\nThis is an automated message – please do not reply."


def _send(subject: str, body: str, to: str = NOTIFY_EMAIL):
    """Low-level send via Gmail SMTP TLS."""
    if not GMAIL_USER or not GMAIL_PASS:
        raise RuntimeError(
            "GMAIL_USER and GMAIL_APP_PASS must be set in the environment or .env file."
        )

    # Safety: never send from the notification address to itself
    if GMAIL_USER.strip().lower() == NOTIFY_EMAIL.strip().lower():
        raise RuntimeError(
            "GMAIL_USER and NOTIFY_EMAIL must be different addresses "
            "to prevent the mailbox from responding to itself."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = GMAIL_USER
    msg["To"]      = to
    msg.attach(MIMEText(body + FOOTER, "plain"))

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(GMAIL_USER, GMAIL_PASS)
        smtp.sendmail(GMAIL_USER, [to], msg.as_string())


def send_confirmation(reservation: dict):
    subject = f"Booking Confirmed – {reservation['name']} on {reservation['date']} at {reservation['time']}"
    body = (
        f"Hello {reservation['name']},\n\n"
        f"Your reservation has been confirmed:\n\n"
        f"  Date      : {reservation['date']}\n"
        f"  Time      : {reservation['time']}\n"
        f"  Party size: {reservation['party_size']}\n"
        f"  Phone     : {reservation.get('phone') or 'N/A'}\n"
        f"  Notes     : {reservation.get('notes') or 'None'}\n\n"
        f"Reservation ID: #{reservation['id']}"
    )
    _send(subject, body)
    # Also notify the guest if their email differs from the notify address
    if reservation["email"].strip().lower() != NOTIFY_EMAIL.strip().lower():
        _send(subject, body, to=reservation["email"])


def send_reminder(reservation: dict):
    subject = f"Reminder – Booking Tomorrow: {reservation['name']} at {reservation['time']}"
    body = (
        f"Hello {reservation['name']},\n\n"
        f"This is a reminder that your reservation is tomorrow:\n\n"
        f"  Date      : {reservation['date']}\n"
        f"  Time      : {reservation['time']}\n"
        f"  Party size: {reservation['party_size']}\n"
        f"  Notes     : {reservation.get('notes') or 'None'}\n\n"
        f"Reservation ID: #{reservation['id']}"
    )
    _send(subject, body)
    if reservation["email"].strip().lower() != NOTIFY_EMAIL.strip().lower():
        _send(subject, body, to=reservation["email"])
