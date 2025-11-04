import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseFilter implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode as number;

        return {
          status: statusCode,
          message: 'Success',
          result,
        };
      }),
    );
  }
}
