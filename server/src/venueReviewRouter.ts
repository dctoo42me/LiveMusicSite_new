// server/src/venueReviewRouter.ts

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { verifyToken } from './auth.js';
import { addVenueReview, getVenueReviews, deleteVenueReview, getAverageRating } from './venueReviewRepository.js';
import logger from './utils/logger.js';

export function createVenueReviewRouter(pool: Pool) {
    const router = Router();

    // GET all reviews for a venue
    router.get('/:venueId', async (req: Request, res: Response) => {
        const { venueId } = req.params;
        try {
            const reviews = await getVenueReviews(pool, parseInt(venueId as string, 10));
            const avgRating = await getAverageRating(pool, parseInt(venueId as string, 10));
            res.json({ reviews, averageRating: avgRating });
        } catch (error) {
            logger.error('Error fetching reviews:', error);
            res.status(500).json({ error: 'Failed to fetch reviews.' });
        }
    });

    // POST a new review
    router.post('/', verifyToken, async (req: Request, res: Response) => {
        const { venueId, rating, comment } = req.body;
        const userId = (req as any).user.userId;

        if (!venueId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Venue ID and a rating between 1 and 5 are required.' });
        }

        try {
            const review = await addVenueReview(pool, userId, venueId, rating, comment);
            res.status(201).json(review);
        } catch (error: any) {
            if (error.constraint === 'unique_user_venue_review') {
                return res.status(409).json({ error: 'You have already reviewed this venue.' });
            }
            logger.error('Error adding review:', error);
            res.status(500).json({ error: 'Failed to add review.' });
        }
    });

    // DELETE a review
    router.delete('/:reviewId', verifyToken, async (req: Request, res: Response) => {
        const { reviewId } = req.params;
        const userId = (req as any).user.userId;

        try {
            await deleteVenueReview(pool, parseInt(reviewId as string, 10), userId);
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting review:', error);
            res.status(500).json({ error: 'Failed to delete review.' });
        }
    });

    return router;
}
