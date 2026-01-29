import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, username, password_hash, role, name FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      name: decoded.name || '',
    };
  } catch {
    return null;
  }
}

export async function updateUserUsername(userId: number, newUsername: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
    [newUsername, userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function updateUserPassword(userId: number, newPasswordHash: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
    [newPasswordHash, userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getUserById(userId: number): Promise<{ username: string; password_hash: string } | null> {
  const result = await pool.query(
    'SELECT username, password_hash FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

