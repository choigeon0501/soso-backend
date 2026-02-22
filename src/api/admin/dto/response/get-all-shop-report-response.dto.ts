import { ApiProperty } from '@nestjs/swagger';

export class GetAllShopReportResponseDto {
  @ApiProperty({
    description: '관리자 화면에서 보여줄 순번 (정렬 이후 1부터 시작)',
    example: 1,
  })
  num: number;

  @ApiProperty({
    description: '신고한 사용자 이메일',
    example: 'reporter@example.com',
  })
  userEmail: string;

  @ApiProperty({
    description: '신고된 소품샵 ID',
    example: 650,
  })
  shopId: number;

  @ApiProperty({
    description: '소품샵 이름',
    example: '소소한 상점',
  })
  shopName: string;

  @ApiProperty({
    description: '소품샵 위치',
    example: '서울시 성동구 어딘가 123-4',
  })
  shopLocation: string;

  @ApiProperty({
    description: '신고 타입',
    example: 'INAPPROPRIATE_CONTENT',
  })
  reportType: string;

  @ApiProperty({
    description: '해당 소품샵 누적 신고 횟수',
    example: 5,
  })
  reportCount: number;

  @ApiProperty({
    description: '신고 일자',
    example: '2025-12-31T05:09:41.874Z',
    type: String,
    format: 'date-time',
  })
  reportDate: Date;

  @ApiProperty({
    example: true,
    description: '소품샵 숨김 여부 (true: 유저에게 숨김, false: 다시 노출)',
  })
  isHidden: boolean;
}
