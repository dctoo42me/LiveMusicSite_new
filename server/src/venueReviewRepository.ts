// server/src/venueReviewRepository.ts

import type { Pool } from 'pg';

export interface VenueReview {
    id: number;
    userId: number;
    username: string;
    avatarUrl: string | null;
    venueId: number;
    rating: number;
    comment: string | null;
    createdAt: string;
}

export async function addVenueReview(
    pool: Pool,
    userId: number,
    venueId: number,
    rating: number,
    comment: string | null
): Promise<VenueReview> {
    const query = `
        INSERT INTO venue_reviews (user_id, venue_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id as "userId", venue_id as "venueId", rating, comment, created_at as "createdAt"
    `;
    const res = await pool.query(query, [userId, venueId, rating, comment]);
    
    // We need to fetch the username too
    const userRes = await pool.query('SELECT username, avatar_url as "avatarUrl" FROM users WHERE id = $1', [userId]);
    return { ...res.rows[0], username: userRes.rows[0].username, avatarUrl: userRes.rows[0].avatarUrl };
}

export async function getVenueReviews(pool: Pool, venueId: number): Promise<VenueReview[]> {
    const query = `
        SELECT 
            vr.id, 
            vr.user_id as "userId", 
            u.username, 
            u.avatar_url as "avatarUrl",
            vr.venue_id as "venueId", 
            vr.rating, 
            vr.comment, 
            vr.created_at as "createdAt"
        FROM venue_reviews vr
        JOIN users u ON vr.user_id = u.id
        WHERE vr.venue_id = $1
        ORDER BY vr.created_at DESC
    `;
    const res = await pool.query(query, [venueId]);
    return res.rows;
}

export async function deleteVenueReview(pool: Pool, reviewId: number, userId: number): Promise<void> {
    const query = 'DELETE FROM venue_reviews WHERE id = $1 AND user_id = $2';
    await pool.query(query, [reviewId, userId]);
}

export async function getAverageRating(pool: Pool, venueId: number): Promise<number | null> {
    const query = 'SELECT AVG(rating)::numeric(2,1) as "averageRating" FROM venue_reviews WHERE venue_id = $1';
    const res = await pool.query(query, [venueId]);
    return res.rows[0].averageRating ? parseFloat(res.rows[0].averageRating) : null;
}
