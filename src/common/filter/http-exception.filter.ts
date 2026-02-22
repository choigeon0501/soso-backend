import {
  ExceptionFilter as NestExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class ExceptionFilter implements NestExceptionFilter {
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

    // 모든 요청에 대해 로깅
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

    // 모든 에러를 하나의 폴더에서 관리
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
