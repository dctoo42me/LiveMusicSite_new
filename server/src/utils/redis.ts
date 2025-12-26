import { Redis } from 'ioredis';
import logger from './logger.js'; // Assuming logger is available

// Use REDIS_URL if available, otherwise construct options from individual variables
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
      host: process.env.REDIS_HOST || '127.0.0.1',
      password: process.env.REDIS_PASSWORD, // ioredis can handle undefined password
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    });

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));

export default redisClient;