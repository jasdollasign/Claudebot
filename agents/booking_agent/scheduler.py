"""
Background scheduler – checks every 30 minutes for reservations
that are ~24 hours away and sends reminder emails.

Run as a daemon:
    source clawd_env/bin/activate
    python agents/booking_agent/scheduler.py
"""
import time
import logging
from apscheduler.schedulers.blocking import BlockingScheduler

from db import get_pending_reminders, mark_reminder_sent
from mailer import send_reminder

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


def check_and_send_reminders():
    pending = get_pending_reminders()
    if not pending:
        log.info("No reminders due.")
        return
    for res in pending:
        try:
            send_reminder(res)
            mark_reminder_sent(res["id"])
            log.info("Reminder sent for reservation #%s (%s on %s %s)",
                     res["id"], res["name"], res["date"], res["time"])
        except Exception as exc:
            log.error("Failed to send reminder for #%s: %s", res["id"], exc)


if __name__ == "__main__":
    from db import init_db
    init_db()
    log.info("Booking reminder scheduler started.")
    scheduler = BlockingScheduler()
    scheduler.add_job(check_and_send_reminders, "interval", minutes=30,
                      id="reminder_check", next_run_time=__import__("datetime").datetime.now())
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Scheduler stopped.")
