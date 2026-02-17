import request from 'supertest';
import { searchVenues } from '../src/venueRepository.ts'; // Moved to top
import { createUser, findUserByEmail } from '../src/authRepository.ts';
import { addFavorite, removeFavorite, getFavorites } from '../src/favoriteRepository.ts';
import { addSavedEvent, removeSavedEvent, getSavedEvents } from '../src/savedEventRepository.ts';
import { vi } from 'vitest';
import bcrypt from 'bcrypt';

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

vi.mock('../src/authRepository.ts', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../src/favoriteRepository.ts', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFavorites: vi.fn(),
}));

vi.mock('../src/savedEventRepository.ts', () => ({
  addSavedEvent: vi.fn(),
  removeSavedEvent: vi.fn(),
  getSavedEvents: vi.fn(),
}));

const { compare, hash } = vi.hoisted(() => {
  return {
    compare: vi.fn(),
    hash: vi.fn(() => Promise.resolve('hashedpassword')),
  }
})

vi.mock('bcrypt', () => ({
  default: {
    compare,
    hash,
  }
}))

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

  describe('POST /api/auth/register', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
      findUserByEmail.mockResolvedValue(null);
      createUser.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('User created successfully');
    });

    it('should return 409 if email already exists', async () => {
      findUserByEmail.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toEqual('Email already exists.');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Username, email, and password are required.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should log in an existing user and return a token', async () => {
      findUserByEmail.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hashedpassword' });
      compare.mockResolvedValue(true);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid email', async () => {
      findUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid email or password.');
    });

    it('should return 401 for incorrect password', async () => {
      findUserByEmail.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hashedpassword' });
      compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid email or password.');
    });

    it('should return 400 if email or password missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Email and password are required.');
    });
  });

  describe('/api/favorites', () => {
    let token: string;

    beforeAll(async () => {
      // Create a user and get a token for testing protected routes
      findUserByEmail.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hashedpassword' });
      compare.mockResolvedValue(true);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      token = res.body.token;
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('POST / should add a favorite for an authenticated user', async () => {
      addFavorite.mockResolvedValue({ id: 1, user_id: 1, venue_id: 1 });
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ venueId: 1 });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('GET / should return favorites for an authenticated user', async () => {
      getFavorites.mockResolvedValue({ venues: [{ id: 1, name: 'Favorite Venue' }], totalCount: 1 });
      const res = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.venues).toHaveLength(1);
    });

    it('DELETE /:venueId should remove a favorite for an authenticated user', async () => {
      removeFavorite.mockResolvedValue({ id: 1, user_id: 1, venue_id: 1 });
      const res = await request(app)
        .delete('/api/favorites/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(204);
    });
  });

  describe('/api/saved-events', () => {
    let token: string;

    beforeAll(async () => {
      findUserByEmail.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hashedpassword' });
      compare.mockResolvedValue(true);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      token = res.body.token;
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('POST / should save an event for an authenticated user', async () => {
      addSavedEvent.mockResolvedValue({ id: 1, user_id: 1, event_id: 101 });
      const res = await request(app)
        .post('/api/saved-events')
        .set('Authorization', `Bearer ${token}`)
        .send({ eventId: 101 });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('GET / should return saved events for an authenticated user', async () => {
      getSavedEvents.mockResolvedValue([{ id: 1, eventId: 101, venueName: 'Test Venue' }]);
      const res = await request(app)
        .get('/api/saved-events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
    });

    it('DELETE /:eventId should remove a saved event for an authenticated user', async () => {
      removeSavedEvent.mockResolvedValue({ id: 1, user_id: 1, event_id: 101 });
      const res = await request(app)
        .delete('/api/saved-events/101')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(204);
    });
  });

  describe('GET /api/venues/search', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('should return 400 if no search parameters are provided', async () => {
      const res = await request(app).get('/api/venues/search');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('At least one search parameter (location, startDate, endDate, or type) is required.');
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
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), 'Austin', '', '', 'both', 10, 0);
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
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), 'Dallas', '', '', 'music', 10, 0);
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
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), 'Houston', '', '', 'both', 5, 10);
    });

    it('should return 500 if searchVenues throws an error', async () => {
      searchVenues.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).get('/api/venues/search?location=Austin');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to execute venue search.');
    });

    it('should call searchVenues with startDate when startDate is provided', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 4, name: 'Date Specific Venue', city: 'Anywhere', state: 'Anystate', date: '2026-02-15', type: 'comedy', description: 'desc', website: 'http://date.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?startDate=2026-02-15');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(1);
      expect(res.body.venues[0].name).toEqual('Date Specific Venue');
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), '', '2026-02-15', '', 'both', 10, 0);
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
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), 'Dallas', '', '', 'jazz', 10, 0);
    });

    it('should handle negative limit by using a minimum limit of 1', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 6, name: 'Limited Venue', city: 'Houston', state: 'TX', date: '2026-03-01', type: 'rock', description: 'desc', website: 'http://limited.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?location=Houston&limit=-5');
      expect(res.statusCode).toEqual(200);
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), 'Houston', '', '', 'both', 1, 0); // Expect limit to be 1
    });

    it('should handle negative offset by using a minimum offset of 0', async () => {
      searchVenues.mockResolvedValue({
        totalCount: 1,
        venues: [{ id: 7, name: 'Offset Venue', city: 'Miami', state: 'FL', date: '2026-04-01', type: 'pop', description: 'desc', website: 'http://offset.com', imageUrl: null }],
      });

      const res = await request(app).get('/api/venues/search?location=Miami&offset=-10');
      expect(res.statusCode).toEqual(200);
      expect(searchVenues).toHaveBeenCalledWith(expect.any(Object), 'Miami', '', '', 'both', 10, 0); // Expect offset to be 0
    });
  });
});