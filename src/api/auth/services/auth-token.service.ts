import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../common/enum/role.enum';
import { AuthTokenResponseDTO } from '../dto/auth.dto';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Access + Refresh Token 발급
   */
  issueTokens(userUuid: string, role: Role): AuthTokenResponseDTO {
    const payload = { sub: userUuid, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
      issuer: this.configService.get<string>('JWT_ISSUER'),
      audience: this.configService.get<string>('JWT_AUDIENCE'),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh Token 검증
   */
  validateRefreshToken(refreshToken: string): { sub: string; role: Role } {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        ignoreExpiration: false,
      });

      return { sub: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Refresh Token 기반 재발급
   */
  reissueTokens(refreshToken: string): AuthTokenResponseDTO {
    const { sub, role } = this.validateRefreshToken(refreshToken);
    return this.issueTokens(sub, role);
  }
}
