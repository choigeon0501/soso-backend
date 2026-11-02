import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../common/const/role.const';
import { AuthTokenResponseDto } from '../dto/response/auth-token-response.dto';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  issueAdminToken(adminId: number): string {
    return this.jwtService.sign(
      { sub: adminId },
      {
        secret: this.configService.get<string>('JWT_ADMIN_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ADMIN_TOKEN_EXPIRES_IN'),
      },
    );
  }

  issueTokens(uuid: string, role: Role): AuthTokenResponseDto {
    const payload = { sub: uuid, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
      issuer: this.configService.get<string>('JWT_ISSUER'),
      audience: this.configService.get<string>('JWT_AUDIENCE'),
    });

    return { accessToken, refreshToken };
  }

  reissueTokens(refreshToken: string): AuthTokenResponseDto {
    let payload: { sub: string; role: Role };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(payload.sub, payload.role);
  }
}
