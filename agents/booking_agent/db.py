"""
SQLite storage layer for the booking agent.
Database file lives at agents/booking_agent/data/reservations.db
"""
import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "reservations.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reservations (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                email       TEXT    NOT NULL,
                phone       TEXT,
                date        TEXT    NOT NULL,   -- ISO 8601: YYYY-MM-DD
                time        TEXT    NOT NULL,   -- HH:MM
                party_size  INTEGER DEFAULT 1,
                notes       TEXT,
                created_at  TEXT    DEFAULT (datetime('now')),
                reminder_sent INTEGER DEFAULT 0  -- 0=no, 1=yes
            )
        """)
        conn.commit()


def add_reservation(name, email, date, time, phone=None, party_size=1, notes=None):
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO reservations (name, email, phone, date, time, party_size, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, email, phone, date, time, party_size, notes))
        conn.commit()
        return cur.lastrowid


def get_reservation(reservation_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM reservations WHERE id = ?", (reservation_id,)
        ).fetchone()
        return dict(row) if row else None


def list_reservations(upcoming_only=False):
    with get_conn() as conn:
        if upcoming_only:
            rows = conn.execute("""
                SELECT * FROM reservations
                WHERE date >= date('now')
                ORDER BY date ASC, time ASC
            """).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM reservations ORDER BY date ASC, time ASC"
            ).fetchall()
        return [dict(r) for r in rows]


def mark_reminder_sent(reservation_id):
    with get_conn() as conn:
        conn.execute(
            "UPDATE reservations SET reminder_sent = 1 WHERE id = ?",
            (reservation_id,)
        )
        conn.commit()


def get_pending_reminders():
    """Return reservations whose date is within the next 25 hours and reminder not yet sent."""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT * FROM reservations
            WHERE reminder_sent = 0
              AND datetime(date || ' ' || time) BETWEEN datetime('now', '+23 hours')
                                                    AND datetime('now', '+25 hours')
        """).fetchall()
        return [dict(r) for r in rows]


def delete_reservation(reservation_id):
    with get_conn() as conn:
        conn.execute("DELETE FROM reservations WHERE id = ?", (reservation_id,))
        conn.commit()
