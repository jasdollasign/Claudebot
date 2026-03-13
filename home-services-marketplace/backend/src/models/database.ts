import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/marketplace.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'provider', 'admin')),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS provider_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
      bio TEXT,
      hourly_rate REAL,
      services TEXT NOT NULL DEFAULT '[]',
      service_radius_miles INTEGER DEFAULT 25,
      background_checked INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      total_jobs INTEGER DEFAULT 0,
      stripe_account_id TEXT,
      availability TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      property_type TEXT NOT NULL CHECK(property_type IN ('house', 'apartment', 'condo', 'townhouse', 'cabin', 'other')),
      bedrooms INTEGER DEFAULT 1,
      bathrooms REAL DEFAULT 1,
      square_feet INTEGER,
      notes TEXT,
      access_instructions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      owner_id TEXT NOT NULL REFERENCES users(id),
      provider_id TEXT REFERENCES users(id),
      service_type TEXT NOT NULL CHECK(service_type IN ('cleaning', 'handyman', 'landscaping', 'pet_sitting', 'home_check', 'other')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      estimated_hours REAL DEFAULT 2,
      price REAL,
      special_instructions TEXT,
      checklist TEXT DEFAULT '[]',
      before_photos TEXT DEFAULT '[]',
      after_photos TEXT DEFAULT '[]',
      started_at TEXT,
      completed_at TEXT,
      cancellation_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id),
      owner_id TEXT NOT NULL REFERENCES users(id),
      provider_id TEXT REFERENCES users(id),
      amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      provider_payout REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'authorized', 'captured', 'refunded', 'failed')),
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id),
      reviewer_id TEXT NOT NULL REFERENCES users(id),
      reviewee_id TEXT NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      quality_score INTEGER CHECK(quality_score BETWEEN 1 AND 5),
      punctuality_score INTEGER CHECK(punctuality_score BETWEEN 1 AND 5),
      communication_score INTEGER CHECK(communication_score BETWEEN 1 AND 5),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
    CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);
}
