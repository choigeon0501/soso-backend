import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google OAuth 인증 후 전달받은 code', example: '4/0AY0e-g7lF1gT0E8hk3...' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Google OAuth 로그인에 사용된 redirect URI', example: 'https://yourapp.com/oauth/google/callback' })
  @IsNotEmpty()
  @IsString()
  redirectUri: string;
}
