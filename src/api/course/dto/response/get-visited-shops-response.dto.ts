import { ApiProperty } from '@nestjs/swagger';

export class VisitedShopItemDto {
  @ApiProperty({ example: 12 })
  shopId: number;

  @ApiProperty({ example: '우들곳' })
  name: string;

  @ApiProperty({ example: 'https://.../main.jpg', nullable: true })
  mainImage: string | null;

  @ApiProperty({ description: '숨김 처리된 소품샵 여부', example: false })
  isHidden: boolean;

  @ApiProperty({ description: '가장 최근 방문 시각', example: '2026-04-20T10:00:00.000Z' })
  lastVisitedAt: Date;
}

export class GetVisitedShopsResponseDto {
  @ApiProperty({ type: [VisitedShopItemDto] })
  items: VisitedShopItemDto[];

  @ApiProperty({ description: '전체 방문 소품샵 수 (중복 제거 후)', example: 7 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
