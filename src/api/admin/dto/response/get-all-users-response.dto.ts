import { ApiProperty } from '@nestjs/swagger';

/* =========================
 * Activity User
 * ========================= */
export class ActivityUserResponseDto {
  @ApiProperty({
    description: '관리자 화면에서 보여줄 순번 (1부터 시작)',
    example: 1,
  })
  num: number;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '소소한유저',
  })
  nickName: string;

  @ApiProperty({
    description: '회원 가입일',
    example: '2025-11-06T02:37:50.106Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: '마지막 활동 일시',
    example: '2025-12-30T02:40:06.000Z',
    type: String,
    format: 'date-time',
  })
  lastActivityAt: Date;

  @ApiProperty({
    description: '로그인 제공자 (google, kakao, local 등)',
    example: 'kakao',
  })
  provider: string;
}

/* =========================
 * Withdrawal User
 * ========================= */
export class WithdrawalUserResponseDto {
  @ApiProperty({
    description: '관리자 화면에서 보여줄 순번 (1부터 시작)',
    example: 1,
  })
  num: number;

  @ApiProperty({
    description: '사용자 uuid',
    example: 'uuid',
  })
  uuid: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '탈퇴유저',
  })
  nickName: string;

  @ApiProperty({
    description: '회원 가입일',
    example: '2025-10-01T08:12:30.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: '탈퇴 사유 코드',
    example: 'SERVICE_DISSATISFACTION',
  })
  withdrawalReason: string;
}
