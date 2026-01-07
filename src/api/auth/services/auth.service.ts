import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as qs from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import * as appleSignin from 'apple-signin-auth';
import axios from 'axios';
import { LoggerService } from '../../../common/logger/logger.service';
import { AppleAuthLoginDto, GoogleAuthLoginDTO, RefreshTokenDTO } from '../dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../common/enum/role.enum';
import { AuthProvider } from '../../../common/enum/auth.enum';
import { AuthIdentityRepository } from '../repositories/auth-identity.repository';
import { AuthTransactionService } from './auth-transcation.service';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthService {
  private googleTokenUrl = 'https://oauth2.googleapis.com/token';
  private googleUserInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(
    private readonly authIdentityRepository: AuthIdentityRepository,
    private readonly authTransactionService: AuthTransactionService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly authTokenService: AuthTokenService,
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

  async googleAuthLogin(googleAuthLoginDTO: GoogleAuthLoginDTO) {
    try {
      const userData = await this.getGoogleUserByCode(googleAuthLoginDTO.code, googleAuthLoginDTO.redirectUri);

      const authIdentity = await this.authIdentityRepository.findAuthIdentityByAuthProviderId(userData.id, AuthProvider.GOOGLE);
      const userUuid = authIdentity?.user?.uuid ?? uuidv4();

      if (!authIdentity) {
        // 2) 신규 가입 경로 → uuid 생성 후 두 테이블에 삽입
        await this.authTransactionService.createUserWithAuthIdentity(userUuid, userData.email, userData.id, AuthProvider.GOOGLE);
      }

      return this.authTokenService.issueTokens(userUuid, Role.User);
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new InternalServerErrorException();
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
        await this.authTransactionService.createUserWithAuthIdentity(userUuid, email, appleId, AuthProvider.APPLE);
      }

      return this.authTokenService.issueTokens(userUuid, Role.User);
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async refreshToken(refreshTokenDTO: RefreshTokenDTO) {
    return this.authTokenService.reissueTokens(refreshTokenDTO.refreshToken);
  }

  async test() {
    return this.authTokenService.issueTokens(this.configService.get<string>('ADMIN_UUID'), Role.User);
  }
}
