import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as qs from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import * as appleSignin from 'apple-signin-auth';
import axios from 'axios';
import { LoggerService } from '../../../common/logger/logger.service';
import { Role } from '../../../common/const/role.const';
import { AuthProvider } from '../const/auth-provider.const';
import { GOOGLE_TOKEN_URL, GOOGLE_USER_INFO_URL } from '../const/google-oauth.const';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { AuthIdentityRepository } from '../repositories/auth-identity.repository';
import { AuthTransactionService } from './auth-transaction.service';
import { AuthTokenService } from './auth-token.service';
import { GoogleLoginDto } from '../dto/request/google-login.dto';
import { AppleLoginDto } from '../dto/request/apple-login.dto';
import { ReissueTokenDto } from '../dto/request/reissue-token.dto';
import { AuthTokenResponseDto } from '../dto/response/auth-token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authIdentityRepository: AuthIdentityRepository,
    private readonly authTransactionService: AuthTransactionService,
    private readonly authTokenService: AuthTokenService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async findAuthIdentityByUuid(uuid: string): Promise<AuthIdentity | null> {
    return this.authIdentityRepository.findByUuid(uuid);
  }

  /**
   * 외부 인증 실패를 포함한 모든 오류를 500으로 응답한다(앱 계약).
   */
  async googleLogin(body: GoogleLoginDto): Promise<AuthTokenResponseDto> {
    try {
      const googleUser = await this.getGoogleUserByCode(body.code, body.redirectUri);

      const authIdentity = await this.authIdentityRepository.findByProviderUidWithUser(googleUser.id, AuthProvider.GOOGLE);
      const uuid = authIdentity?.user?.uuid ?? uuidv4();
      if (!authIdentity) {
        await this.authTransactionService.createUserWithAuthIdentity(uuid, googleUser.email, googleUser.id, AuthProvider.GOOGLE);
      }

      return this.authTokenService.issueTokens(uuid, Role.User);
    } catch (err) {
      this.loggerService.logError('Auth/ googleAuthLogin Error', { googleAuthLoginDTO: body, err });
      throw new InternalServerErrorException();
    }
  }

  /**
   * ID Token 검증 실패도 바깥 catch에서 500으로 바뀐다(앱 계약).
   */
  async appleLogin(body: AppleLoginDto): Promise<AuthTokenResponseDto> {
    try {
      const payload = await this.verifyAppleIdToken(body.idToken);

      const authIdentity = await this.authIdentityRepository.findByProviderUidWithUser(payload.sub, AuthProvider.APPLE);
      const uuid = authIdentity?.user?.uuid ?? uuidv4();
      if (!authIdentity) {
        await this.authTransactionService.createUserWithAuthIdentity(uuid, payload.email, payload.sub, AuthProvider.APPLE);
      }

      return this.authTokenService.issueTokens(uuid, Role.User);
    } catch (err) {
      this.loggerService.logError('Auth/ appleAuthLogin Error', { appleAuthLoginDTO: body, err });
      throw new InternalServerErrorException();
    }
  }

  async reissueToken(body: ReissueTokenDto): Promise<AuthTokenResponseDto> {
    return this.authTokenService.reissueTokens(body.refreshToken);
  }

  private async getGoogleUserByCode(code: string, redirectUri: string): Promise<{ id: string; email: string }> {
    try {
      const tokenResponse = await axios.post(
        GOOGLE_TOKEN_URL,
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

      const userResponse = await axios.get(GOOGLE_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return userResponse.data;
    } catch (err) {
      this.loggerService.logError('Auth/ getGoogleUserByCode Error', { code, redirectUri, err });
      throw new InternalServerErrorException();
    }
  }

  private async verifyAppleIdToken(idToken: string) {
    try {
      return await appleSignin.verifyIdToken(idToken, {
        audience: this.configService.get<string>('APPLE_AUDIENCE_ID'),
      });
    } catch (err) {
      this.loggerService.logError('Auth/ validateAppleToken Error', { idToken, err });
      throw new UnauthorizedException('Apple ID Token 검증 실패');
    }
  }
}
