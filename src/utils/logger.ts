import * as path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const LOG_DIR = path.resolve(process.cwd(), 'reports', 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

const fileTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'test-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp }) =>
      `${timestamp as string} [${level}] ${message as string}`,
    ),
  ),
});

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [fileTransport, consoleTransport],
});
