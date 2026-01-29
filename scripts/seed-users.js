const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crane_safety',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function seedUsers() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const viewerPassword = await bcrypt.hash('viewer123', 10);

    await pool.query(
      `INSERT INTO users (username, password_hash, role, name) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['admin', adminPassword, 'admin', 'Admin User']
    );

    await pool.query(
      `INSERT INTO users (username, password_hash, role, name) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['viewer', viewerPassword, 'viewer', 'Viewer User']
    );

    console.log('Users seeded successfully!');
    console.log('Admin: admin / admin123');
    console.log('Viewer: viewer / viewer123');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedUsers();

