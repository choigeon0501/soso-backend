import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({ description: 'Apple 로그인에서 발급된 ID Token (JWT)', example: 'eyJraWQiOiJQRTQ2TzJZRlp...' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
