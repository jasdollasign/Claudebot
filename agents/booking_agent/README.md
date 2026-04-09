# Booking Agent

Stores reservations in a local SQLite database, sends confirmation emails via Gmail,
and fires a 24-hour reminder automatically.

## Setup

```bash
# From the repo root
python3 -m venv clawd_env
source clawd_env/bin/activate
pip install -r agents/booking_agent/requirements.txt

cp agents/booking_agent/.env.example agents/booking_agent/.env
# Edit .env – set GMAIL_USER (sender), GMAIL_APP_PASS, NOTIFY_EMAIL
```

## Usage

```bash
source clawd_env/bin/activate

# Add a reservation (interactive)
python agents/booking_agent/booking_agent.py add

# List all reservations
python agents/booking_agent/booking_agent.py list

# List upcoming only
python agents/booking_agent/booking_agent.py list --upcoming

# Show details of reservation #3
python agents/booking_agent/booking_agent.py show 3

# Delete reservation #3
python agents/booking_agent/booking_agent.py delete 3

# Manually trigger reminder check
python agents/booking_agent/booking_agent.py check-reminders
```

## 24-hour reminder daemon

```bash
source clawd_env/bin/activate
python agents/booking_agent/scheduler.py
```

Run this as a background service (systemd, screen, etc.). It checks every 30 minutes
and sends a reminder email for any reservation that is between 23-25 hours away.

## Data storage

`agents/booking_agent/data/reservations.db` – SQLite database, never committed to git.

## Email behaviour

- Confirmation email is sent when a reservation is created.
- Reminder email is sent ~24 hours before the reservation.
- Every email includes: **"This is an automated message – please do not reply."**
- `GMAIL_USER` (sender) must be **different** from `NOTIFY_EMAIL` (`fprioai@gmail.com`)
  to prevent the mailbox from responding to itself. The agent enforces this at runtime.
