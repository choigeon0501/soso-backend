import { ApiProperty } from '@nestjs/swagger';

export class GetUserProfileResponseDto {
  @ApiProperty({ description: '유저 이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '프로필 사진 PreSigned URL', example: '...' })
  profileImg: string;

  @ApiProperty({ description: '닉네임', example: '소소한유저' })
  nickName: string;

  provider: string;
}
