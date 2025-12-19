import request from 'supertest';
import { searchVenues } from '../src/venueRepository.ts'; // Moved to top
import { vi } from 'vitest';

// We need to import the app from index.ts to test it.
// However, to avoid circular dependencies and ensure a clean test environment,
// it's best practice to export the app separately from the server startup logic.
// For now, we will assume `src/index.ts` exports the 'app' object.
// If it doesn't, we'll need to refactor `src/index.ts` to export 'app'.

// Placeholder for the actual app import. Will likely need refactoring of index.ts
// to export the app instead of directly calling app.listen().
let app: any;

vi.mock('../src/db.ts', () => ({
  __esModule: true,
  createPool: vi.fn(() => ({
    connect: vi.fn(() => ({
      query: vi.fn((sql) => {
        if (sql === 'SELECT 1') {
          return Promise.resolve({ rows: [{ count: 1 }] });
        }
        return Promise.resolve({ rows: [] });
      }),
      release: vi.fn(),
    })),
    query: vi.fn((sql) => {
      if (sql === 'SELECT 1') {
        return Promise.resolve({ rows: [{ count: 1 }] });
      }
      return Promise.resolve({ rows: [] });
    }),
    end: vi.fn(),
  })),
}));

// Mock the venueRepository to control search results
vi.mock('../src/venueRepository.ts', () => ({
  searchVenues: vi.fn(),
}));

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Dynamically import the app after mocks are set up
    // This is a common pattern when `app` is initialized in index.ts
    const module = await import('../src/index');
    app = module.createApp(); // Initialize app here
  });

  afterAll(async () => {
    // Clean up if necessary, e.g., close database connections
    // For now, nothing specific needed since DB is mocked.
  });

  it('GET /api/status should return 200 and success message', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('LiveMusicSite API is running successfully!');
    expect(res.body.db_status).toEqual('Connected');
  });

  describe('GET /api/venues/search', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('should return 400 if no search parameters are provided', async () => {
      const res = await request(app).get('/api/venues/search');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('At least one search parameter (location, date, or type) is required.');
    });

    it('should return venues including website for valid search with type "both"', async () => {
      // Mock searchVenues to return specific data
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [
          {
            id: 1,
            name: 'Test Venue',
            city: 'Austin',
            state: 'TX',
            zipcode: '78704',
            date: '2025-12-25',
            type: 'music',
            description: 'A cool music spot.',
            website: 'http://testvenue.com',
            imageUrl: null,
          },
        ],
      });

      const res = await request(app).get('/api/venues/search?location=Austin&type=both');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(1);
      expect(res.body.venues[0].name).toEqual('Test Venue');
      expect(res.body.venues[0].website).toEqual('http://testvenue.com');
      expect(searchVenues).toHaveBeenCalledWith('Austin', '', 'both', 10, 0);
    });

    it('should filter by type "music" correctly', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [
          {
            id: 2,
            name: 'Music Hall',
            city: 'Dallas',
            state: 'TX',
            zipcode: '75201',
            date: '2025-12-31',
            type: 'music',
            description: 'Live music only.',
            website: 'http://musichall.com',
            imageUrl: null,
          },
        ],
      });

      const res = await request(app).get('/api/venues/search?location=Dallas&type=music');
      expect(res.statusCode).toEqual(200);
      expect(res.body.venues[0].type).toEqual('music');
      expect(searchVenues).toHaveBeenCalledWith('Dallas', '', 'music', 10, 0);
    });

    it('should handle empty search results gracefully', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 0,
        venues: [],
      });

      const res = await request(app).get('/api/venues/search?location=Nowhere');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(0);
      expect(res.body.venues).toEqual([]);
      expect(searchVenues).toHaveBeenCalled();
    });

    it('should handle pagination parameters', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 20,
        venues: Array(5).fill({
          id: 3, name: 'Paginated Venue', city: 'Houston', state: 'TX', date: '2026-01-01',
          type: 'music', description: 'desc', website: 'http://paginated.com', imageUrl: null
        }),
      });

      const res = await request(app).get('/api/venues/search?location=Houston&limit=5&offset=10');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(5);
      expect(searchVenues).toHaveBeenCalledWith('Houston', '', 'both', 5, 10);
    });

    it('should return 500 if searchVenues throws an error', async () => {
      searchVenues.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).get('/api/venues/search?location=Austin');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to execute venue search.');
    });

    it('should call searchVenues with date when only date is provided', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 4, name: 'Date Specific Venue', city: 'Anywhere', state: 'Anystate', date: '2026-02-15', type: 'comedy', description: 'desc', website: 'http://date.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?date=2026-02-15');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(1);
      expect(res.body.venues[0].name).toEqual('Date Specific Venue');
      expect(searchVenues).toHaveBeenCalledWith('', '2026-02-15', 'both', 10, 0);
    });

    it('should call searchVenues with location and type when date is not provided', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 5, name: 'Location Type Venue', city: 'Dallas', state: 'TX', date: '2025-12-25', type: 'jazz', description: 'desc', website: 'http://locationtype.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?location=Dallas&type=jazz');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(1);
      expect(res.body.venues[0].name).toEqual('Location Type Venue');
      expect(searchVenues).toHaveBeenCalledWith('Dallas', '', 'jazz', 10, 0);
    });

    it('should handle negative limit by using a minimum limit of 1', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 6, name: 'Limited Venue', city: 'Houston', state: 'TX', date: '2026-03-01', type: 'rock', description: 'desc', website: 'http://limited.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?location=Houston&limit=-5');
      expect(res.statusCode).toEqual(200);
      expect(searchVenues).toHaveBeenCalledWith('Houston', '', 'both', 1, 0); // Expect limit to be 1
    });

    it('should handle negative offset by using a minimum offset of 0', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 7, name: 'Offset Venue', city: 'Miami', state: 'FL', date: '2026-04-01', type: 'pop', description: 'desc', website: 'http://offset.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?location=Miami&offset=-10');
      expect(res.statusCode).toEqual(200);
      expect(searchVenues).toHaveBeenCalledWith('Miami', '', 'both', 10, 0); // Expect offset to be 0
    });
  });
});