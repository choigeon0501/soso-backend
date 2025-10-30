import { ExceptionFilter, Catch, ArgumentsHost, HttpException, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch() // 모든 예외를 잡음
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // HttpException.getResponse()는 string 또는 객체일 수 있음
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        // Nest 기본 형식: { statusCode, message, error }
        message = (payload as any)?.message || exception.message || 'HttpException';
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 404는 노이즈 → 응답만 내려주고 로그 스킵
    if (status === 404 || exception instanceof NotFoundException) {
      return res.status(status).json({
        status,
        message,
      });
    }

    // 로그 메타 (추적용)
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      status,
      ua: req.headers['user-agent'],
      // 필요시 요청ID/유저ID 등 추가
      // requestId: req.headers['x-request-id'],
    };

    // 레벨 라우팅
    if (status >= 500) {
      this.logger.error(message, meta);
    } else {
      this.logger.warn(message, meta);
    }

    // 클라이언트 응답 (내부 스택은 노출하지 않음)
    res.status(status).json({
      status,
      message,
    });
  }
}
