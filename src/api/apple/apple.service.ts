import { Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class AppleService {
  constructor(private readonly loggerService: LoggerService) {}
  async verifyAppleSignedPayload(token: string) {
    const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

    const { payload } = await jwtVerify(token, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: 'com.your.app.serviceid',
    });

    return payload as {
      sub: string;
      events: { type: string };
    };
  }

  async appleNotifications(body: any) {
    const { signedPayload } = body;
    const payload = await this.verifyAppleSignedPayload(signedPayload);

    const appleUserId = payload.sub;
    const eventType = payload.events?.type;

    switch (eventType) {
      case 'email-disabled':
        await this.handleEmailDisabled(appleUserId);
        break;

      case 'email-enabled':
        await this.handleEmailEnabled(appleUserId);
        break;

      case 'consent-revoked':
        await this.handleConsentRevoked(appleUserId);
        break;

      case 'account-delete':
        await this.handleAccountDelete(appleUserId);
        break;

      default:
        this.loggerService.warn('Unknown Apple event:', eventType);
    }

    // 반드시 200 OK 반환
    return { ok: true };
  }
}
