// server/src/utils/logger.ts
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize, errors } = format;
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});
const logger = createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), // This line is crucial for logging stack traces
    logFormat),
    transports: [
        new transports.Console({
            format: combine(colorize(), logFormat)
        }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
    ],
    exitOnError: false, // Do not exit on handled exceptions
});
// Create a 'logs' directory if it doesn't exist
import fs from 'fs';
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
export default logger;
//# sourceMappingURL=logger.js.map