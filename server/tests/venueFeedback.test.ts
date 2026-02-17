// server/tests/venueFeedback.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitVenueFeedback } from '../src/venueRepository';
import type { Pool, PoolClient } from 'pg';

describe('submitVenueFeedback', () => {
  let mockClient: any;
  let mockPool: any;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };
  });

  it('should record feedback and update venue counters', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // INSERT into venue_feedback
      .mockResolvedValueOnce({   // UPDATE venues
        rows: [{
          id: 1,
          positive_confirmations: 1,
          negative_confirmations: 0,
          verification_status: 'UNVERIFIED'
        }]
      })
      .mockResolvedValueOnce({}); // COMMIT

    const result = await submitVenueFeedback(mockPool as unknown as Pool, 123, 1, true);

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      'INSERT INTO venue_feedback (user_id, venue_id, has_live_performance, suggested_website) VALUES ($1, $2, $3, $4)',
      [123, 1, true, undefined]
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE venues SET positive_confirmations = positive_confirmations + 1 WHERE id = $1 RETURNING *',
      [1]
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(result.positive_confirmations).toBe(1);
  });

  it('should update venue website if suggested and venue has no website', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // INSERT
      .mockResolvedValueOnce({   // UPDATE (returns venue without website)
        rows: [{
          id: 1,
          positive_confirmations: 1,
          negative_confirmations: 0,
          verification_status: 'UNVERIFIED',
          website: null
        }]
      })
      .mockResolvedValueOnce({}) // UPDATE website
      .mockResolvedValueOnce({}); // COMMIT

    await submitVenueFeedback(mockPool as unknown as Pool, 123, 1, true, 'https://new-site.com');

    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE venues SET website = $1 WHERE id = $2',
      ['https://new-site.com', 1]
    );
  });

  it('should auto-verify venue when positive confirmations reach 3', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // INSERT
      .mockResolvedValueOnce({   // UPDATE (returns 3 positive confirmations)
        rows: [{
          id: 1,
          positive_confirmations: 3,
          negative_confirmations: 0,
          verification_status: 'UNVERIFIED'
        }]
      })
      .mockResolvedValueOnce({}) // UPDATE verification_status
      .mockResolvedValueOnce({}); // COMMIT

    await submitVenueFeedback(mockPool as unknown as Pool, 123, 1, true);

    expect(mockClient.query).toHaveBeenCalledWith(
      "UPDATE venues SET verification_status = 'COMMUNITY_VERIFIED' WHERE id = $1",
      [1]
    );
  });

  it('should flag venue when negative confirmations reach 3', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // INSERT
      .mockResolvedValueOnce({   // UPDATE (returns 3 negative confirmations)
        rows: [{
          id: 1,
          positive_confirmations: 0,
          negative_confirmations: 3,
          verification_status: 'UNVERIFIED'
        }]
      })
      .mockResolvedValueOnce({}) // UPDATE verification_status
      .mockResolvedValueOnce({}); // COMMIT

    await submitVenueFeedback(mockPool as unknown as Pool, 123, 1, false);

    expect(mockClient.query).toHaveBeenCalledWith(
      "UPDATE venues SET verification_status = 'FLAGGED' WHERE id = $1",
      [1]
    );
  });

  it('should rollback on error', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error('DB Error')); // INSERT fails

    await expect(submitVenueFeedback(mockPool as unknown as Pool, 123, 1, true))
      .rejects.toThrow('DB Error');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
