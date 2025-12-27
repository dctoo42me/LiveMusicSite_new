import { Redis } from 'ioredis';
import logger from './logger.js'; // Assuming logger is available
// Initialize Redis client
let redisClient;
if (process.env.REDIS_URL) {
    // If a REDIS_URL environment variable is provided, use it directly
    redisClient = new Redis(process.env.REDIS_URL);
}
else {
    // Otherwise, construct options from individual environment variables (for local development or specific configurations)
    const redisOptions = {
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
        host: process.env.REDIS_HOST || '127.0.0.1',
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    };
    // Conditionally add password if it exists to satisfy ioredis type requirements
    if (process.env.REDIS_PASSWORD) {
        redisOptions.password = process.env.REDIS_PASSWORD;
    }
    redisClient = new Redis(redisOptions);
}
redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));
export default redisClient;
//# sourceMappingURL=redis.js.map