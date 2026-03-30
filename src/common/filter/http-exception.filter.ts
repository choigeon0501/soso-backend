import {
  ExceptionFilter as NestExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class ExceptionFilter implements NestExceptionFilter {
  private readonly logger = new Logger(ExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Unknown error';

    // NestJS Logger → 콘솔 출력 (Railway 대시보드에서 확인 가능)
    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(exceptionResponse)}`,
    );
    this.logger.error(`Request URL: ${request.method} ${request.url}`);
    this.logger.error(`Request Body: ${JSON.stringify(request.body)}`);
    if (exception instanceof Error) {
      this.logger.error(`Stack: ${exception.stack}`);
    }

    // Winston → 파일 로깅 (PM2/로컬 서버용)
    const errorResponse = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error:
        typeof exceptionResponse === 'object' && 'error' in exceptionResponse
          ? (exceptionResponse as any).error
          : undefined,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
      body: request.body,
      query: request.query,
      params: request.params,
    };
    this.loggerService.logError(request.url, errorResponse);

    // 클라이언트 응답 (스택 트레이스 제외)
    const clientResponse: any = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error:
        typeof exceptionResponse === 'object' && 'error' in exceptionResponse
          ? (exceptionResponse as any).error
          : undefined,
    };

    response.status(status).json(clientResponse);
  }
}
