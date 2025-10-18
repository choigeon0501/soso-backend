import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as qs from 'querystring';
import * as appleSignin from 'apple-signin-auth';
import { UserRepository } from '../user/user.repository';
import axios from 'axios';
import { LoggerService } from '../logger/logger.service';
import { AppleAuthLoginDto, GoogleAuthLoginDTO, RefreshTokenDTO } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enum/role.enum';
import { AuthProvider } from '../../common/enum/auth.enum';

@Injectable()
export class AuthService {
  private googleTokenUrl = 'https://oauth2.googleapis.com/token';
  private googleUserInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(
    private userRepository: UserRepository,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  private getAppleAudiences(): string[] {
    return [this.configService.get<string>('APPLE_IOS_BUNDLE_ID'), this.configService.get<string>('APPLE_SERVICE_ID')].filter(Boolean);
  }

  async googleAuthLogin(googleAuthLoginDTO: GoogleAuthLoginDTO) {
    try {
      const { code, redirectUri } = googleAuthLoginDTO;
      if (!code || !redirectUri) throw new BadRequestException('Not Found Code Or RedirectUri');

      const tokenResponse = await axios.post(
        this.googleTokenUrl,
        qs.stringify({
          code: code,
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get(this.googleUserInfoUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData = userResponse.data;
      const existUser = await this.userRepository.findUserByUUID(userData.id);
      if (!existUser) {
        await this.userRepository.createUser(userData.id, userData.email, AuthProvider.GOOGLE, userData.picture);
      }

      const role = userData.id === this.configService.get<string>('ADMIN_UUID') ? Role.Admin : Role.User;

      const accessToken = jwt.sign({ uuid: userData.id, role }, this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'), {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRESIN'),
      });

      const refreshToken = jwt.sign({ uuid: userData.id, role }, this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'), {
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRESIN'),
      });

      return { accessToken, refreshToken };
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async appleAuthLogin(appleAuthLoginDTO: AppleAuthLoginDto) {
    const payload = await this.validateAppleToken(appleAuthLoginDTO.idToken);

    const appleId = payload.sub;
    const email = payload.email;

    const existUser = await this.userRepository.findUserByUUID(appleId);
    if (!existUser) {
      await this.userRepository.createUser(appleId, email, AuthProvider.APPLE, null);
    }

    const role = appleId === this.configService.get<string>('ADMIN_UUID') ? Role.Admin : Role.User;

    const accessToken = jwt.sign({ uuid: appleId, role }, this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'), {
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRESIN'),
    });

    const refreshToken = jwt.sign({ uuid: appleId, role }, this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'), {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRESIN'),
    });

    return { accessToken, refreshToken };
  }

  async validateAppleToken(idToken: string) {
    try {
      const payload = await appleSignin.verifyIdToken(idToken);

      if (payload.iss !== 'https://appleid.apple.com') {
        throw new UnauthorizedException('Invalid token issuer');
      }

      // 3) audience 화이트리스트 검사 (앱/웹 모두 허용)
      const validAudiences = this.getAppleAudiences();
      if (!validAudiences.includes(payload.aud as string)) {
        throw new UnauthorizedException('Invalid audience');
      }

      return payload;
    } catch (err) {
      this.loggerService.warn(`Auth/ GoogleAuthLogin Error: ${err}`);
      throw new UnauthorizedException('Apple ID Token 검증 실패');
    }
  }

  async refresh(refreshTokenDTO: RefreshTokenDTO) {
    const { refreshToken } = refreshTokenDTO;
    try {
      if (!refreshToken) throw new UnauthorizedException('Not Fount Refresh Token In Header');

      const payload = jwt.verify(refreshToken, this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')) as { uuid: string };

      const role = payload.uuid === this.configService.get<string>('ADMIN_UUID') ? Role.Admin : Role.User;

      const newAccessToken = jwt.sign({ uuid: payload.uuid, role }, this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'), {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRESIN'),
      });

      const newRefreshToken = jwt.sign({ uuid: payload.uuid, role }, this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'), {
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRESIN'),
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      this.loggerService.warn(`Auth/ Refresh Error: ${err}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
