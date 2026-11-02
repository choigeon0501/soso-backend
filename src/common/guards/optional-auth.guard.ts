import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService, // ✅ ConfigService 주입
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'); // ✅ 환경변수에서 secret 읽기

    try {
      const decoded = jwt.verify(token, secret);
      request.user = decoded;
    } catch (err) {
      request.user = null;
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      }
    }

    return true; // 인증 여부와 관계없이 요청 계속 허용
  }
}
