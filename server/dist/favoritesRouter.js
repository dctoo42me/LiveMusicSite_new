// server/src/favoritesRouter.ts
import express from 'express';
import { verifyToken } from './auth.js';
import { addFavorite, removeFavorite, getFavorites } from './favoriteRepository.js';
import logger from './utils/logger.js';
export function createFavoritesRouter(pool) {
    const router = express.Router();
    // Note: All routes in this router are automatically prefixed with /api/favorites
    // POST / (which corresponds to /api/favorites)
    router.post('/', verifyToken, async (req, res) => {
        const { venueId } = req.body;
        const userId = req.user.userId;
        if (!venueId) {
            return res.status(400).json({ error: 'Venue ID is required.' });
        }
        try {
            const favorite = await addFavorite(pool, userId, venueId);
            if (favorite) {
                res.status(201).json(favorite);
            }
            else {
                res.status(409).json({ error: 'This venue is already in your favorites.' });
            }
        }
        catch (error) {
            logger.error('Add favorite error:', error);
            res.status(500).json({ error: 'Failed to add favorite.' });
        }
    });
    // DELETE /:venueId (which corresponds to /api/favorites/:venueId)
    router.delete('/:venueId', verifyToken, async (req, res) => {
        const { venueId } = req.params;
        const userId = req.user.userId;
        if (!venueId) {
            return res.status(400).json({ error: 'Venue ID is required.' });
        }
        try {
            await removeFavorite(pool, userId, parseInt(venueId, 10));
            res.status(204).send();
        }
        catch (error) {
            logger.error('Remove favorite error:', error);
            res.status(500).json({ error: 'Failed to remove favorite.' });
        }
    });
    // GET / (which corresponds to /api/favorites)
    router.get('/', verifyToken, async (req, res) => {
        const userId = req.user.userId;
        try {
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            const favorites = await getFavorites(pool, userId, limit, offset);
            res.json(favorites);
        }
        catch (error) {
            logger.error('Get favorites error:', error);
            res.status(500).json({ error: 'Failed to retrieve favorites.' });
        }
    });
    return router;
}
//# sourceMappingURL=favoritesRouter.js.map