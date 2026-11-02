import { ApiProperty } from '@nestjs/swagger';

export class CourseListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '성수동 데이트 코스' })
  name: string;

  @ApiProperty({ example: '2026-04-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '진행률 (0~100)', example: 50 })
  progress: number;

  @ApiProperty({ description: '코스 상태', enum: ['in_progress', 'completed'], example: 'in_progress' })
  status: 'in_progress' | 'completed';

  @ApiProperty({ description: '대표 썸네일 URL (최대 4개, 순서대로)', type: [String], example: ['https://.../1.jpg', 'https://.../2.jpg'] })
  thumbnails: string[];
}

export class GetCourseListResponseDto {
  @ApiProperty({ type: [CourseListItemDto] })
  items: CourseListItemDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
