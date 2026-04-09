#!/usr/bin/env python3
"""
Booking Agent CLI
-----------------
Usage:
    python booking_agent.py add
    python booking_agent.py list [--upcoming]
    python booking_agent.py show <id>
    python booking_agent.py delete <id>
    python booking_agent.py check-reminders   # manual trigger

Run inside clawd_env:
    source clawd_env/bin/activate
    python agents/booking_agent/booking_agent.py add
"""
import argparse
import sys
import os

# Allow running from the repo root or from within the agents/booking_agent dir
sys.path.insert(0, os.path.dirname(__file__))

from db import init_db, add_reservation, get_reservation, list_reservations, delete_reservation
from mailer import send_confirmation
from scheduler import check_and_send_reminders


def prompt(label, required=True, default=None):
    while True:
        val = input(f"  {label}{' [required]' if required else ''}: ").strip()
        if val:
            return val
        if not required:
            return default
        print("  This field is required.")


def cmd_add():
    print("\n=== New Reservation ===")
    name       = prompt("Guest name")
    email      = prompt("Guest email")
    phone      = prompt("Phone number", required=False)
    date       = prompt("Date (YYYY-MM-DD)")
    time_      = prompt("Time (HH:MM, 24h)")
    party_size = prompt("Party size", required=False, default="1")
    notes      = prompt("Notes / special requests", required=False)

    try:
        party_size = int(party_size)
    except ValueError:
        party_size = 1

    rid = add_reservation(
        name=name, email=email, phone=phone,
        date=date, time=time_,
        party_size=party_size, notes=notes,
    )
    reservation = get_reservation(rid)
    print(f"\nReservation #{rid} saved.")

    try:
        send_confirmation(reservation)
        print("Confirmation email sent.")
    except Exception as exc:
        print(f"Warning: could not send confirmation email – {exc}")


def cmd_list(upcoming_only=False):
    rows = list_reservations(upcoming_only=upcoming_only)
    if not rows:
        print("No reservations found.")
        return
    print(f"\n{'ID':>4}  {'Name':<20}  {'Date':<12}  {'Time':<6}  {'Party':>5}  {'Reminder':>8}")
    print("-" * 65)
    for r in rows:
        sent = "yes" if r["reminder_sent"] else "no"
        print(f"{r['id']:>4}  {r['name']:<20}  {r['date']:<12}  {r['time']:<6}  {r['party_size']:>5}  {sent:>8}")


def cmd_show(rid):
    r = get_reservation(rid)
    if not r:
        print(f"Reservation #{rid} not found.")
        return
    for k, v in r.items():
        print(f"  {k:<15}: {v}")


def cmd_delete(rid):
    r = get_reservation(rid)
    if not r:
        print(f"Reservation #{rid} not found.")
        return
    confirm = input(f"Delete reservation #{rid} for {r['name']} on {r['date']}? [y/N] ").strip().lower()
    if confirm == "y":
        delete_reservation(rid)
        print("Deleted.")
    else:
        print("Cancelled.")


def main():
    init_db()

    parser = argparse.ArgumentParser(description="Booking Agent")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("add", help="Add a new reservation")

    p_list = sub.add_parser("list", help="List reservations")
    p_list.add_argument("--upcoming", action="store_true", help="Only show future reservations")

    p_show = sub.add_parser("show", help="Show a reservation")
    p_show.add_argument("id", type=int)

    p_del = sub.add_parser("delete", help="Delete a reservation")
    p_del.add_argument("id", type=int)

    sub.add_parser("check-reminders", help="Manually trigger 24h reminder check")

    args = parser.parse_args()

    if args.command == "add":
        cmd_add()
    elif args.command == "list":
        cmd_list(upcoming_only=args.upcoming)
    elif args.command == "show":
        cmd_show(args.id)
    elif args.command == "delete":
        cmd_delete(args.id)
    elif args.command == "check-reminders":
        check_and_send_reminders()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
