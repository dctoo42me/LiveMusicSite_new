// server/tests/savedEventRepository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSavedEvent, removeSavedEvent, getSavedEvents } from '../src/savedEventRepository';
import type { Pool } from 'pg';

describe('savedEventRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPool = {
    query: vi.fn(),
  } as unknown as Pool;

  describe('addSavedEvent', () => {
    it('should insert a saved event and return it', async () => {
      const mockSavedEvent = { id: 1, user_id: 1, event_id: 101 };
      (mockPool.query as vi.Mock).mockResolvedValueOnce({ rows: [mockSavedEvent] });

      const result = await addSavedEvent(mockPool, 1, 101);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2) RETURNING *',
        [1, 101]
      );
      expect(result).toEqual(mockSavedEvent);
    });

    it('should return null on unique constraint violation (already saved)', async () => {
      const error = new Error('Unique constraint violation');
      (error as any).code = '23505';
      (mockPool.query as vi.Mock).mockRejectedValueOnce(error);

      const result = await addSavedEvent(mockPool, 1, 101);

      expect(result).toBeNull();
    });

    it('should throw other errors', async () => {
      const error = new Error('Database error');
      (mockPool.query as vi.Mock).mockRejectedValueOnce(error);

      await expect(addSavedEvent(mockPool, 1, 101)).rejects.toThrow('Database error');
    });
  });

  describe('removeSavedEvent', () => {
    it('should delete a saved event and return it', async () => {
      const mockDeletedEvent = { id: 1, user_id: 1, event_id: 101 };
      (mockPool.query as vi.Mock).mockResolvedValueOnce({ rows: [mockDeletedEvent] });

      const result = await removeSavedEvent(mockPool, 1, 101);

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2 RETURNING *',
        [1, 101]
      );
      expect(result).toEqual(mockDeletedEvent);
    });
  });

  describe('getSavedEvents', () => {
    it('should return a list of saved events for a user', async () => {
      const mockSavedEvents = [
        {
          id: 1,
          eventId: 101,
          venueId: 10,
          venueName: 'The Venue',
          city: 'Austin',
          state: 'TX',
          date: '2026-02-15T20:00:00Z',
          type: 'music',
          description: 'Live Band',
          imageUrl: 'http://example.com/image.jpg'
        }
      ];
      (mockPool.query as vi.Mock).mockResolvedValueOnce({ rows: mockSavedEvents });

      const result = await getSavedEvents(mockPool, 1);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result).toEqual(mockSavedEvents);
    });
  });
});
