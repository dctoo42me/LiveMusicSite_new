// server/src/authRepository.ts
import { Pool } from 'pg'; // Import Pool type for declaration
import logger from './utils/logger.js'; // Import logger
// server/src/authRepository.ts



export async function createUser(pool: Pool, username: string, email: string, passwordHash: string, marketingOptIn: boolean = false) {
  const res = await pool.query(
    'INSERT INTO users (username, email, password_hash, marketing_opt_in) VALUES ($1, $2, $3, $4) RETURNING id, username, email, marketing_opt_in as "marketingOptIn"',
    [username, email, passwordHash, marketingOptIn]
  );
  return res.rows[0];
}

export async function findUserByEmail(pool: Pool, email: string) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] || null;
}

export async function findUserById(pool: Pool, id: number) {
  const res = await pool.query('SELECT id, username, email, role, avatar_url as "avatarUrl", bio, onboarding_completed as "onboardingCompleted", marketing_opt_in as "marketingOptIn" FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function updateUserProfile(pool: Pool, id: number, avatarUrl: string | undefined, bio: string | undefined, onboardingCompleted?: boolean, marketingOptIn?: boolean) {
  const res = await pool.query(
    'UPDATE users SET avatar_url = COALESCE($1, avatar_url), bio = COALESCE($2, bio), onboarding_completed = COALESCE($3, onboarding_completed), marketing_opt_in = COALESCE($4, marketing_opt_in) WHERE id = $5 RETURNING id, username, email, avatar_url as "avatarUrl", bio, onboarding_completed as "onboardingCompleted", marketing_opt_in as "marketingOptIn"',
    [avatarUrl, bio, onboardingCompleted, marketingOptIn, id]
  );
  return res.rows[0];
}
