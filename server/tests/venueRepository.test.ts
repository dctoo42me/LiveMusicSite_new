// server/tests/venueRepository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchVenues } from '../src/venueRepository';
import type { Pool, PoolClient } from 'pg';
import redisClient from '../src/utils/redis.js';

// Mock the redis client
vi.mock('../src/utils/redis.js', () => ({
  default: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe('searchVenues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return venues from the database on a cache miss', async () => {
    // 1. Setup Mocks
    const mockClient = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // First call for COUNT(*)
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Venue' }] }), // Second call for venues
      release: vi.fn(),
    };

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient as unknown as PoolClient),
    };

    // Mock a cache miss
    (redisClient.get as vi.Mock).mockResolvedValue(null);

    // 2. Call the function
    const result = await searchVenues(mockPool as unknown as Pool, 'Test Location', '', 'both', 10, 0);

    // 3. Assertions
    expect(redisClient.get).toHaveBeenCalled();
    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledTimes(2); // Should be called for count and for venues
    expect(redisClient.setex).toHaveBeenCalled(); // Should cache the new result
    expect(mockClient.release).toHaveBeenCalled();
    expect(result.venues).toEqual([{ id: 1, name: 'Test Venue' }]);
    expect(result.totalCount).toBe(1);
  });

  it('should return venues from the cache on a cache hit', async () => {
    // 1. Setup Mocks
    const cachedData = {
      totalCount: 1,
      venues: [{ id: 1, name: 'Cached Test Venue' }],
    };
    (redisClient.get as vi.Mock).mockResolvedValue(JSON.stringify(cachedData));

    const mockPool = {
      connect: vi.fn(),
    };

    // 2. Call the function
    const result = await searchVenues(mockPool as unknown as Pool, 'Test Location', '', 'both', 10, 0);

    // 3. Assertions
    expect(redisClient.get).toHaveBeenCalled();
    expect(mockPool.connect).not.toHaveBeenCalled(); // Should NOT connect to the DB
    expect(result).toEqual(cachedData);
  });
});
