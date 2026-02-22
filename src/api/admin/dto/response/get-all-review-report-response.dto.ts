import { ApiProperty } from '@nestjs/swagger';

export class GetAllReviewReportResponseDto {
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
    description: '신고 타입',
    example: 'SPAM',
  })
  reportType: string;

  @ApiProperty({
    description: '신고 상세 사유 메시지',
    example: '광고성 내용이 포함되어 있습니다.',
  })
  reportMessage: string;

  @ApiProperty({
    description: '신고된 리뷰 내용',
    example: '이 가게 진짜 좋아요! 이벤트 참여하세요!',
  })
  reviewContent: string;

  @ApiProperty({
    description: '신고 일자',
    example: '2025-12-31T05:09:59.800Z',
    type: String,
    format: 'date-time',
  })
  reportDate: Date;

  @ApiProperty({
    description: '해당 리뷰 누적 신고 횟수',
    example: 3,
  })
  reportCount: number;
}
