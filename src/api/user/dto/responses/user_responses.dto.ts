import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponsesDTO {
  @ApiProperty({ description: '유저 이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '프로필 사진 PreSigned URL', example: '...' })
  profileImg: string;

  @ApiProperty({ description: '닉네임', example: '소소한유저' })
  nickName: string;

  constructor({ email, profileImg, nickName }: { email: string; profileImg: string; nickName: string }) {
    this.email = email;
    this.profileImg = profileImg;
    this.nickName = nickName;
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

// Put용 DTO
export class PreSignedURLResponsesDTO {
  @ApiProperty({
    description: 'S3 객체 키 (DB에 저장할 값). 예: 사용자별 아바타/리뷰 이미지 등의 경로',
    example: 'users/7b2e1f/avatar/20250818/9f7b2c1a-12ab-34cd-56ef-7890ab12cd34.png',
  })
  key: string;

  @ApiProperty({
    description: '클라이언트가 직접 업로드(PUT) 또는 조회(GET)에 사용할 수 있는 Presigned URL',
    example:
      'https://my-bucket.s3.ap-northeast-2.amazonaws.com/users/7b2e1f/avatar/20250818/9f7b2c1a-12ab-34cd-56ef-7890ab12cd34.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...%2F20250818%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20250818T050000Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'Presigned URL 유효기간(초). 만료 후에는 다시 발급 필요',
    example: 300,
  })
  expiresIn: number;

  constructor({ key, url, expiresIn }: { key: string; url: string; expiresIn: number }) {
    this.key = key;
    this.url = url;
    this.expiresIn = expiresIn;
  }
}
