import request from 'supertest';
import { createApp } from '../src/index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { vi } from 'vitest';
import * as authRepository from '../src/authRepository'; // Import the actual module
import * as favoriteRepository from '../src/favoriteRepository'; // Import the actual module

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

describe('Favorite Venues Endpoints', () => {
  let app: ReturnType<typeof createApp>; // Declare app here
  let userToken: string;
  let userId: number;
  let venueId: number;

  const testUser = {
    username: 'favuser',
    email: 'favuser@example.com',
    password: 'testpassword',
  };

  const testVenue = {
    id: 100, // Hardcoded ID for the mock venue
    name: 'Favorite Test Venue',
    city: 'Austin',
    state: 'TX',
    zipcode: '78704',
    type: 'music',
    description: 'A great place',
    website: 'http://fav.com',
    date: '2025-12-25',
  };

  // In-memory stores for users, venues, and favorite venues
  const inMemoryUsers: any[] = [];
  const inMemoryVenues: any[] = [];
  const inMemoryFavoriteVenues: any[] = [];

  beforeAll(async () => {
    app = createApp(); // Initialize app here

    // Create a test user directly in the in-memory store
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    inMemoryUsers.push({ id: 1, username: testUser.username, email: testUser.email, password_hash: passwordHash });
    userId = 1; // Assuming the first user created gets ID 1

    userToken = jwt.sign({ userId: userId, username: testUser.username }, JWT_SECRET, { expiresIn: '1h' });

    // Create a test venue directly in the in-memory store
    inMemoryVenues.push(testVenue);
    venueId = testVenue.id;
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Clear any previous mock calls

    // Reset in-memory stores before each test to ensure isolation
    inMemoryUsers.length = 0;
    inMemoryUsers.push({ id: 1, username: testUser.username, email: testUser.email, password_hash: bcrypt.hashSync(testUser.password, 10) }); // Re-add test user for each test
    inMemoryVenues.length = 0;
    inMemoryVenues.push(testVenue);
    inMemoryFavoriteVenues.length = 0;

    // Spy on authRepository methods
    vi.spyOn(authRepository, 'createUser').mockImplementation(async (pool, username, email, passwordHash) => {
      const id = inMemoryUsers.length + 1;
      const newUser = { id, username, email, password_hash: passwordHash };
      inMemoryUsers.push(newUser);
      return newUser;
    });

    vi.spyOn(authRepository, 'findUserByEmail').mockImplementation(async (pool, email) => {
      return inMemoryUsers.find(u => u.email === email) || null;
    });

    // Spy on favoriteRepository methods
    vi.spyOn(favoriteRepository, 'addFavorite').mockImplementation(async (pool, userId, venueId) => {
      const existing = inMemoryFavoriteVenues.find(f => f.user_id === userId && f.venue_id === venueId);
      if (existing) return null; // Conflict
      const id = inMemoryFavoriteVenues.length + 1;
      const newFav = { id, user_id: userId, venue_id: venueId };
      inMemoryFavoriteVenues.push(newFav);
      return newFav;
    });

    vi.spyOn(favoriteRepository, 'removeFavorite').mockImplementation(async (pool, userId, venueId) => {
      const index = inMemoryFavoriteVenues.findIndex(f => f.user_id === userId && f.venue_id === venueId);
      if (index !== -1) {
        return inMemoryFavoriteVenues.splice(index, 1)[0];
      }
      return null;
    });

    vi.spyOn(favoriteRepository, 'getFavorites').mockImplementation(async (pool, userId) => {
      const userFavorites = inMemoryFavoriteVenues.filter(f => f.user_id === userId);
      return userFavorites.map(fav => inMemoryVenues.find(v => v.id === fav.venue_id)).filter(Boolean);
    });
  });

  afterAll(async () => {
    // Clear in-memory mocks after all tests in this suite
    inMemoryUsers.length = 0;
    inMemoryVenues.length = 0;
    inMemoryFavoriteVenues.length = 0;
  });

  describe('POST /api/favorites', () => {
    it('should add a venue to favorites', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ venueId });

      expect(res.statusCode).toEqual(201);
      expect(res.body.user_id).toEqual(userId);
      expect(res.body.venue_id).toEqual(venueId);
    });

    it('should return 409 if trying to add a duplicate favorite', async () => {
      // Add it once
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ venueId });

      // Try to add again
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ venueId });

      expect(res.statusCode).toEqual(409);
    });

    it('should return 400 if venueId is missing', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Venue ID is required.');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .send({ venueId });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/favorites', () => {
    beforeEach(async () => {
      // Add a favorite specifically for this describe block's tests
      await favoriteRepository.addFavorite(null, userId, venueId);
    });

    it('should retrieve a user\'s favorite venues', async () => {
      const res = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toEqual(venueId);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/favorites');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('DELETE /api/favorites/:venueId', () => {
    it('should remove a venue from favorites', async () => {
      const res = await request(app)
        .delete(`/api/favorites/${venueId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(204);

      const getRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`);
      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body).toEqual([]);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).delete(`/api/favorites/${venueId}`);
      expect(res.statusCode).toEqual(401);
    });
  });
});
