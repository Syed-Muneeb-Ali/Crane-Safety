/**
 * Migration: Add username column for existing DBs that have users.email.
 * Run this once if you previously had email-based login, then run: node scripts/seed-users.js
 */
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crane_safety',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function migrate() {
  const client = await pool.connect();
  try {
    const hasEmail = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    const hasUsername = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'username'
    `);

    if (hasEmail.rows.length === 0) {
      console.log('Users table has no email column (already on username). Nothing to do.');
      return;
    }

    if (hasUsername.rows.length === 0) {
      await client.query('ALTER TABLE users ADD COLUMN username VARCHAR(255)');
      await client.query(`
        UPDATE users SET username = COALESCE(split_part(email, '@', 1), 'user' || id::text) WHERE username IS NULL
      `);
      await client.query('ALTER TABLE users ALTER COLUMN username SET NOT NULL');
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username)');
      console.log('Username column added and backfilled from email.');
    } else {
      console.log('Username column already present.');
    }

    await client.query('ALTER TABLE users DROP COLUMN IF EXISTS email');
    console.log('Migration complete: email column removed. You can run: node scripts/seed-users.js');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
