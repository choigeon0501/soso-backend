import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthLoginDTO {
  @ApiProperty({
    description: 'Google OAuth 인증 후 전달받은 code',
    example: '4/0AY0e-g7lF1gT0E8hk3...',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Google OAuth 로그인에 사용된 redirect URI',
    example: 'https://yourapp.com/oauth/google/callback',
  })
  @IsNotEmpty()
  @IsString()
  redirectUri: string;
}

export class AppleAuthLoginDto {
  @ApiProperty({
    description: 'Apple 로그인에서 발급된 ID Token (JWT)',
    example: 'eyJraWQiOiJQRTQ2TzJZRlp...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class RefreshTokenDTO {
  @ApiProperty({
    description: '리프레시 토큰 (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class AuthTokenResponseDTO {
  @ApiProperty({
    description: '액세스 토큰 (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '리프레시 토큰 (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
