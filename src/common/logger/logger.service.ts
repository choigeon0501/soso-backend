import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors, splat } = winston.format;

// 순환 참조 안전 직렬화(필요시 간단 버전)
const safeStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  });
};

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    // 로그 디렉토리 보장
    const logDir = path.resolve('logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    this.logger = winston.createLogger({
      level: 'error',
      format: combine(
        splat(), // %s, %o 포맷 지원
        errors({ stack: true }), // Error 객체 스택 자동 포함
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf(({ timestamp, level, message, stack, ...meta }) => {
          const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
          const ctx = Object.keys(meta).length ? ` ${safeStringify(meta)}` : '';
          const st = stack ? `\n${stack}` : '';
          return base + ctx + st;
        }),
      ),
      transports: [
        // 5xx 등 에러
        new winston.transports.DailyRotateFile({
          filename: 'logs/errors/%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
    });
  }

  logError(path: string, errorResponse: any) {
    // 모든 에러를 하나의 폴더에서 관리
    const logMessage = `[${path}] ${errorResponse.message || 'Unknown error'}`;
    this.logger.error(logMessage, errorResponse);
  }
}
