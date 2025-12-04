import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as qs from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import * as appleSignin from 'apple-signin-auth';
import { UserRepository } from '../user/repositories/user.repository';
import axios from 'axios';
import { LoggerService } from '../../common/logger/logger.service';
import { AppleAuthLoginDto, AuthTokenResponseDTO, GoogleAuthLoginDTO, RefreshTokenDTO } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enum/role.enum';
import { AuthProvider } from '../../common/enum/auth.enum';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private googleTokenUrl = 'https://oauth2.googleapis.com/token';
  private googleUserInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(
    private userRepository: UserRepository,
    private authIdentityRepository: AuthIdentityRepository,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  private async getGoogleUserByCode(code: string, redirectUri: string) {
    try {
      const tokenResponse = await axios.post(
        this.googleTokenUrl,
        qs.stringify({
          code,
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error('Google OAuth: access_token not found');
      }

      const userResponse = await axios.get(this.googleUserInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return userResponse.data;
    } catch (err) {
      this.loggerService.warn(`Auth/ getGoogleUserByCode Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async googleAuthLogin(googleAuthLoginDTO: GoogleAuthLoginDTO) {
    try {
      const userData = await this.getGoogleUserByCode(googleAuthLoginDTO.code, googleAuthLoginDTO.redirectUri);

      const authIdentity = await this.authIdentityRepository.findAuthIdentityByAuthProviderId(userData.id, AuthProvider.GOOGLE);
      const userUuid = authIdentity?.user?.uuid ?? uuidv4();

      if (!authIdentity) {
        // 2) 신규 가입 경로 → uuid 생성 후 두 테이블에 삽입
        // 트랜잭션으로 묶기
        await this.userRepository.createUser(userUuid, userData.email, AuthProvider.GOOGLE, null);
        await this.authIdentityRepository.createAuthIdentity(userData.id, AuthProvider.GOOGLE, userUuid);
      }

      const adminUuid = this.configService.get<string>('ADMIN_UUID');
      const role = userUuid === adminUuid ? Role.Admin : Role.User;
      const jwtPayload = { sub: userUuid, role };

      const accessToken = this.jwtService.sign(jwtPayload);
      const refreshToken = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      return new AuthTokenResponseDTO(accessToken, refreshToken);
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  private async validateAppleToken(idToken: string) {
    try {
      return await appleSignin.verifyIdToken(idToken, {
        audience: this.configService.get<string>('APPLE_AUDIENCE_ID'),
      });
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new UnauthorizedException('Apple ID Token 검증 실패');
    }
  }

  async appleAuthLogin(appleAuthLoginDTO: AppleAuthLoginDto) {
    try {
      const { idToken } = appleAuthLoginDTO;
      const payload = await this.validateAppleToken(idToken);

      const appleId = payload.sub;
      const email = payload.email;

      const authIdentity = await this.authIdentityRepository.findAuthIdentityByAuthProviderId(appleId, AuthProvider.APPLE);
      const userUuid = authIdentity?.user?.uuid ?? uuidv4();

      if (!authIdentity) {
        // 2) 신규 가입 경로 → uuid 생성 후 두 테이블에 삽입
        // 트랜잭션으로 묶기
        await this.userRepository.createUser(userUuid, email, AuthProvider.APPLE, null);
        await this.authIdentityRepository.createAuthIdentity(appleId, AuthProvider.APPLE, userUuid);
      }

      const adminUuid = this.configService.get<string>('ADMIN_UUID');
      const role = userUuid === adminUuid ? Role.Admin : Role.User;
      const jwtPayload = { sub: userUuid, role };

      const accessToken = this.jwtService.sign(jwtPayload);
      const refreshToken = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      return new AuthTokenResponseDTO(accessToken, refreshToken);
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async refreshToken(refreshTokenDTO: RefreshTokenDTO) {
    const { refreshToken } = refreshTokenDTO;
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        ignoreExpiration: false,
      });

      const { sub, role } = payload;

      const newAccessToken = this.jwtService.sign({ sub, role });
      const newRefreshToken = this.jwtService.sign(
        { sub, role },
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
          issuer: this.configService.get<string>('JWT_ISSUER'),
          audience: this.configService.get<string>('JWT_AUDIENCE'),
        },
      );

      return new AuthTokenResponseDTO(newAccessToken, newRefreshToken);
    } catch (err) {
      this.loggerService.warn(`Auth/ Refresh Error: ${err}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async test() {
    const payload = { sub: this.configService.get<string>('ADMIN_UUID'), role: Role.Admin };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
      issuer: this.configService.get<string>('JWT_ISSUER'),
      audience: this.configService.get<string>('JWT_AUDIENCE'),
    });

    return new AuthTokenResponseDTO(accessToken, refreshToken);
  }
}
