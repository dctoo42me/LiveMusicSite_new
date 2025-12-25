// server/src/authRepository.ts
export async function createUser(pool, username, email, passwordHash) {
    const res = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email', [username, email, passwordHash]);
    return res.rows[0];
}
export async function findUserByUsername(pool, username) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
}
//# sourceMappingURL=authRepository.js.map