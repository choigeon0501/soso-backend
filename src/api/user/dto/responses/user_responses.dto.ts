import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponsesDTO {
  @ApiProperty({ description: '유저 이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '프로필 사진 PreSigned URL', example: '...' })
  profileImg: string;

  @ApiProperty({ description: '닉네임', example: '소소한유저' })
  nickName: string;

  provider: string;

  constructor({ email, profileImg, nickName }: { email: string; profileImg: string; nickName: string }, provider: string) {
    this.email = email;
    this.profileImg = profileImg;
    this.nickName = nickName;
    this.provider = provider;
  }
}

// Get용 DTO
export class PresignedUserProfileImgResponsesDTO {
  @ApiProperty({ description: '유저 프로필 Presigend URL', example: '...' })
  profileImg?: string;

  @ApiProperty({
    description: 'Presigned URL 유효기간(초). 만료 후에는 다시 발급 필요',
    example: 300,
  })
  expiresIn: number;

  constructor(profileImg, expiresIn) {
    this.profileImg = profileImg;
    this.expiresIn = expiresIn;
  }
}
