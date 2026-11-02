import { ApiProperty } from '@nestjs/swagger';

export class GetNoticeResponseDto {
  @ApiProperty({ description: '공지 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '공지 제목', example: '서버 점검 안내' })
  title: string;

  @ApiProperty({ description: '공지 내용', example: '서버 점검으로 인해 8월 10일 00:00~02:00 서비스가 중단됩니다.' })
  content: string;

  @ApiProperty({ description: '작성일', example: '2025-08-06T12:34:56.000Z' })
  createdAt: Date;
}
