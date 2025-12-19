import request from 'supertest';
import { createApp } from '../src/index';
import bcrypt from 'bcrypt';
import { vi } from 'vitest';
import * as authRepository from '../src/authRepository'; // Import the actual module

describe.sequential('Auth Endpoints', () => {
  let app: ReturnType<typeof createApp>; // Declare app here

  // We'll create a basic test user once for the entire suite
  const testUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123',
  };

  // In-memory store for users, simulating a database table
  const inMemoryUsers: any[] = [];

  beforeAll(async () => {
    app = createApp(); // Initialize app here
    
    // Create the initial test user directly in the in-memory store
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    inMemoryUsers.push({ id: 1, username: testUser.username, email: testUser.email, password_hash: passwordHash });
  });

  // Reset mocks and clear inMemoryUsers before each test
  beforeEach(() => {
    vi.clearAllMocks(); // Clear any previous mock calls

    // Spy on repository methods and define their mock implementations
    vi.spyOn(authRepository, 'createUser').mockImplementation(async (pool, username, email, passwordHash) => {
      const id = inMemoryUsers.length + 1;
      const newUser = { id, username, email, password_hash: passwordHash };
      inMemoryUsers.push(newUser);
      return newUser;
    });

    vi.spyOn(authRepository, 'findUserByUsername').mockImplementation(async (pool, username) => {
      return inMemoryUsers.find(u => u.username === username) || null;
    });
  });

  afterAll(async () => {
    // Clear inMemoryUsers after all tests in this suite
    inMemoryUsers.length = 0;
  });

  describe('POST /api/auth/register', () => {
    it('should not register a user with a duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username, // Using the pre-created username
          email: 'duplicate@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toEqual('Username already exists.');
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'newregisteruser',
            email: 'newregisteruser@example.com',
            password: 'password123',
          });
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('User created successfully');
      });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.token).toBeDefined();
    });

    it('should not log in with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid username or password.');
    });
  });

  describe('GET /api/protected', () => {
    let token: string;

    beforeAll(async () => {
      // Ensure the test user exists (from top-level beforeAll) then login for this block
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });
      token = res.body.token;
    });

    it('should access the protected route with a valid token', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('This is a protected route.');
      expect(res.body.user).toBeDefined();
    });

    it('should not access the protected route without a token', async () => {
      const res = await request(app).get('/api/protected');
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Access token not found.');
    });

    it('should not access the protected route with an invalid token', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toEqual('Invalid or expired token.');
    });
  });
});