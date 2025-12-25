// server/src/authRepository.ts
import { Pool } from 'pg'; // Import Pool type for declaration
import logger from './utils/logger.js'; // Import logger
// server/src/authRepository.ts



export async function createUser(pool: Pool, username: string, email: string, passwordHash: string) {
  const res = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
    [username, email, passwordHash]
  );
  return res.rows[0];
}

export async function findUserByUsername(pool: Pool, username: string) {
  const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0] || null;
}
