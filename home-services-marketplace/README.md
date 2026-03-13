# HomeServe - Home Services Marketplace

A full-stack platform connecting **Airbnb/short-term rental hosts** with **on-demand home service providers** including cleaners, handymen, landscapers, pet sitters, and home checkers.

## Features

### For Property Owners
- **Multi-property management** — register and manage all your Airbnb/rental properties
- **One-click service booking** — schedule cleaning, repairs, landscaping, pet care, and home checks
- **Real-time job tracking** — see live status updates as providers work
- **Photo documentation** — before/after photos for every job
- **Task checklists** — service-specific checklists auto-generated per job type
- **Secure payments** — pay via Stripe, funds released only when job is completed
- **In-app messaging** — communicate directly with your service provider
- **Review system** — rate and review providers after each job
- **Notifications** — instant alerts for booking updates

### For Service Providers
- **Browse available jobs** — see all open jobs matching your service types
- **Accept & manage jobs** — start/complete jobs with digital checklist
- **Earnings dashboard** — track monthly and lifetime income
- **Profile & reputation** — build your rating through completed jobs
- **Background check verification** — display your credentials to win more jobs

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (7-day tokens) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | TanStack Query (React Query) |
| Routing | React Router v6 |
| Payments | Stripe (mock in dev) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd home-services-marketplace

# Install all dependencies
npm run install:all

# (Optional) Seed with demo data
npm run seed
```

### Running Locally

```bash
# Start both backend and frontend (requires concurrently)
npm run dev

# Or run separately:
npm run dev:backend  # API on http://localhost:3001
npm run dev:frontend # UI on http://localhost:5173
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Property Owner | owner@example.com | password123 |
| Cleaner | cleaner@example.com | password123 |
| Handyman | handyman@example.com | password123 |
| Landscaper | landscaper@example.com | password123 |
| Pet Sitter | petsitter@example.com | password123 |
| Home Checker | checker@example.com | password123 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/properties | List properties |
| POST | /api/properties | Create property |
| GET | /api/bookings | List bookings |
| POST | /api/bookings | Create booking |
| POST | /api/bookings/:id/accept | Provider accepts job |
| POST | /api/bookings/:id/start | Provider starts job |
| POST | /api/bookings/:id/complete | Provider completes job |
| POST | /api/bookings/:id/cancel | Cancel booking |
| GET | /api/providers | Browse providers |
| POST | /api/payments/create-intent | Initiate payment |
| POST | /api/reviews | Submit review |
| GET | /api/notifications | Get notifications |

## Service Types & Rates

| Service | Rate |
|---------|------|
| Cleaning | $80/hr |
| Handyman | $95/hr |
| Landscaping | $75/hr |
| Pet Sitting | $45/hr |
| Home Check | $60/hr |

## Business Model

- **15% platform fee** on all completed bookings
- Providers earn **85%** of the booking price
- Payments are held until job is marked complete

## Architecture

```
home-services-marketplace/
├── backend/
│   └── src/
│       ├── models/        # SQLite database schema
│       ├── routes/        # Express route handlers
│       ├── middleware/    # Auth, validation
│       └── utils/         # Seed data
└── frontend/
    └── src/
        ├── pages/         # Route components
        │   ├── owner/     # Property owner views
        │   └── provider/  # Service provider views
        ├── components/    # Reusable UI components
        ├── context/       # Auth state
        ├── hooks/         # API client
        └── types/         # TypeScript types
```
