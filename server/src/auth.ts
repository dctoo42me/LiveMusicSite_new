// server/src/auth.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from './authRepository.js';
import logger from './utils/logger.js';
import { Pool } from 'pg';
import { logAction } from './utils/audit.js';
import { sendWelcomeEmail } from './utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';
logger.info(`JWT_SECRET is set to: ${JWT_SECRET ? '******' : 'undefined or default'}`);

export async function register(pool: Pool, req: Request, res: Response) {
  const { username, email, password, marketingOptIn } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  try {
    const existingUser = await findUserByEmail(pool, email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await createUser(pool, username, email, passwordHash, !!marketingOptIn);
    
    // Log the registration
    await logAction(pool, newUser.id, 'USER_REGISTERED', 'users', newUser.id, { username, email, marketingOptIn: !!marketingOptIn });

    // Send welcome email
    await sendWelcomeEmail(email, username);

    res.status(201).json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    logger.error('Registration error:', error); // Use logger
    res.status(500).json({ error: 'Failed to register user.' });
  }
}

export async function login(pool: Pool, req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await findUserByEmail(pool, email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        onboardingCompleted: user.onboarding_completed,
        marketingOptIn: user.marketing_opt_in
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Login error:', error);
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
    logger.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware to check if the user has the required roles
 */
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
    }
    next();
  };
}

export async function logout(req: Request, res: Response) {
  const userId = (req as any).user.userId; // userId is available from verifyToken middleware
  logger.info(`User ${userId} logged out.`);
  res.status(200).json({ message: 'Logged out successfully.' });
}
