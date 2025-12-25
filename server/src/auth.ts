// server/src/auth.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from './authRepository.js';
import logger from './utils/logger.js'; // Import logger
import { Pool } from 'pg'; // Import Pool type for register/login

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

export async function register(pool: Pool, req: Request, res: Response) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  try {
    const existingUser = await findUserByUsername(pool, username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await createUser(pool, username, email, passwordHash);
    res.status(201).json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    logger.error('Registration error:', error); // Use logger
    res.status(500).json({ error: 'Failed to register user.' });
  }
}

export async function login(pool: Pool, req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await findUserByUsername(pool, username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (error) {
    logger.error('Login error:', error); // Use logger
    res.status(500).json({ error: 'Failed to log in.' });
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token not found.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error); // Use logger
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}
