import { ApiProperty } from '@nestjs/swagger';

export class CourseStopShopDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: '우들곳' })
  name: string;

  @ApiProperty({ example: 'https://.../main.jpg', nullable: true })
  mainImage: string | null;

  @ApiProperty({ example: 37.5445 })
  lat: number;

  @ApiProperty({ example: 127.0553 })
  lng: number;

  @ApiProperty({ description: '숨김 처리된 소품샵 여부. true면 프론트에서 안내 UI', example: false })
  isHidden: boolean;

  @ApiProperty({ example: 'https://instagram.com/shop', nullable: true })
  instagram: string | null;
}

export class CourseStopDto {
  @ApiProperty({ example: 12 })
  shopId: number;

  @ApiProperty({ description: '코스 내 순서 (1부터)', example: 1 })
  orderIndex: number;

  @ApiProperty({ description: '방문 시각. null이면 미방문', example: '2026-04-20T10:00:00.000Z', nullable: true })
  visitedAt: Date | null;

  @ApiProperty({ type: () => CourseStopShopDto })
  shop: CourseStopShopDto;
}

export class GetCourseDetailResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '성수동 데이트 코스' })
  name: string;

  @ApiProperty({ example: '2026-04-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-20T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '진행률 (0~100)', example: 50 })
  progress: number;

  @ApiProperty({ enum: ['in_progress', 'completed'], example: 'in_progress' })
  status: 'in_progress' | 'completed';

  @ApiProperty({ type: [CourseStopDto] })
  stops: CourseStopDto[];
}
