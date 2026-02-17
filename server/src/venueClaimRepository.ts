// server/src/venueClaimRepository.ts
import { Pool } from 'pg';

export interface VenueClaim {
  id: number;
  userId: number;
  venueId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proofUrl: string | null;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createVenueClaim(pool: Pool, userId: number, venueId: number, proofUrl: string | null, details: string | null) {
  const res = await pool.query(
    'INSERT INTO venue_claims (user_id, venue_id, proof_url, details) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, venueId, proofUrl, details]
  );
  return res.rows[0];
}

export async function getVenueClaimById(pool: Pool, id: number) {
  const res = await pool.query('SELECT * FROM venue_claims WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function updateVenueClaimStatus(pool: Pool, id: number, status: 'APPROVED' | 'REJECTED') {
  const res = await pool.query(
    'UPDATE venue_claims SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );
  return res.rows[0];
}

export async function getAllVenueClaims(pool: Pool) {
  const res = await pool.query(`
    SELECT 
      vc.*, 
      u.username, 
      u.email, 
      v.name as "venueName"
    FROM venue_claims vc
    JOIN users u ON vc.user_id = u.id
    JOIN venues v ON vc.venue_id = v.id
    ORDER BY vc.created_at DESC
  `);
  return res.rows;
}
