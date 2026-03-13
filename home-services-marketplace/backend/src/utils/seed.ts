import { getDb } from '../models/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const db = getDb();
  console.log('Seeding database...');

  const ownerPassword = await bcrypt.hash('password123', 12);
  const providerPassword = await bcrypt.hash('password123', 12);

  // Create owner
  const ownerId = uuidv4();
  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_verified)
      VALUES (?, ?, ?, 'owner', 'Sarah', 'Johnson', '555-0101', 1)
    `).run(ownerId, 'owner@example.com', ownerPassword);
    console.log('Created owner: owner@example.com / password123');
  } catch (e: any) {
    if (!e.message.includes('UNIQUE')) throw e;
    console.log('Owner already exists');
  }

  // Create providers
  const providers = [
    { email: 'cleaner@example.com', firstName: 'Maria', lastName: 'Garcia', services: ['cleaning'], rate: 75, bio: 'Professional cleaner with 8 years experience. Specialized in vacation rentals and Airbnb properties.', rating: 4.9, jobs: 312 },
    { email: 'handyman@example.com', firstName: 'Bob', lastName: 'Smith', services: ['handyman', 'other'], rate: 95, bio: 'Licensed handyman. Quick fixes to major repairs. Available for emergency calls.', rating: 4.7, jobs: 189 },
    { email: 'landscaper@example.com', firstName: 'Carlos', lastName: 'Rivera', services: ['landscaping'], rate: 70, bio: 'Full-service landscaping and lawn care. Weekly, bi-weekly, or one-time services.', rating: 4.8, jobs: 256 },
    { email: 'petsitter@example.com', firstName: 'Emma', lastName: 'Davis', services: ['pet_sitting'], rate: 45, bio: 'Animal lover with 5 years pet sitting experience. Will treat your pets like my own.', rating: 5.0, jobs: 147 },
    { email: 'checker@example.com', firstName: 'James', lastName: 'Wilson', services: ['home_check', 'cleaning'], rate: 60, bio: 'Thorough home inspection and checking service. Detailed reports with photos after every visit.', rating: 4.6, jobs: 98 },
  ];

  for (const p of providers) {
    const userId = uuidv4();
    try {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_verified)
        VALUES (?, ?, ?, 'provider', ?, ?, 1)
      `).run(userId, p.email, providerPassword, p.firstName, p.lastName);

      const profileId = uuidv4();
      db.prepare(`
        INSERT INTO provider_profiles (id, user_id, bio, hourly_rate, services, background_checked, rating, total_reviews, total_jobs, service_radius_miles)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 30)
      `).run(profileId, userId, p.bio, p.rate, JSON.stringify(p.services), p.rating, Math.floor(p.jobs * 0.8), p.jobs);

      console.log(`Created provider: ${p.email} / password123`);
    } catch (e: any) {
      if (!e.message.includes('UNIQUE')) throw e;
      console.log(`Provider ${p.email} already exists`);
    }
  }

  // Create property for owner
  const ownerRow = db.prepare('SELECT id FROM users WHERE email = ?').get('owner@example.com') as any;
  if (ownerRow) {
    const propCount = (db.prepare('SELECT COUNT(*) as c FROM properties WHERE owner_id = ?').get(ownerRow.id) as any).c;
    if (propCount === 0) {
      const prop1Id = uuidv4();
      const prop2Id = uuidv4();
      db.prepare(`
        INSERT INTO properties (id, owner_id, name, address, city, state, zip, property_type, bedrooms, bathrooms, square_feet, notes, access_instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(prop1Id, ownerRow.id, 'Beach House Retreat', '123 Ocean Drive', 'Miami', 'FL', '33101', 'house', 3, 2, 1800, 'Beachfront Airbnb property. Premium guests.', 'Lockbox code: 4521. Key in lockbox on front porch.');

      db.prepare(`
        INSERT INTO properties (id, owner_id, name, address, city, state, zip, property_type, bedrooms, bathrooms, square_feet, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(prop2Id, ownerRow.id, 'Downtown Condo', '456 Main St #8B', 'Miami', 'FL', '33102', 'condo', 1, 1, 750, 'Urban condo near business district.');

      console.log('Created sample properties');
    }
  }

  console.log('\nSeed complete!');
  console.log('Test accounts:');
  console.log('  Owner:    owner@example.com / password123');
  console.log('  Cleaner:  cleaner@example.com / password123');
  console.log('  Handyman: handyman@example.com / password123');
}

seed().catch(console.error);
