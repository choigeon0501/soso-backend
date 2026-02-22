import { ApiProperty } from '@nestjs/swagger';
import { PageInfoDTO, PaginationResponsesDto } from './pagination_responses.dto';
import { UserFavorite } from '../../entities/user-favorite.entity';

export class ShopItemDTO {
  @ApiProperty({ description: '소품샵 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '소품샵 이름', example: '카페포 옹' })
  name: string;

  @ApiProperty({ description: '대표 이미지 URL', example: 'https://example.com/image.jpg', nullable: true })
  mainImage: string | null;
}

export class UserFavoriteRecordItemDTO {
  @ApiProperty({ description: '찜 기록 ID', example: 15 })
  id: number;

  @ApiProperty({ description: '생성일', example: '2025-08-02T06:11:18.498Z' })
  createdAt: Date;

  @ApiProperty({ type: ShopItemDTO, description: '소품샵 정보' })
  shop: ShopItemDTO;

  constructor(record: UserFavorite) {
    this.id = record.id;
    this.createdAt = record.createdAt;
    this.shop = {
      id: record.shop.id,
      name: record.shop.name,
      mainImage: record.shop.mainImage ?? null,
    };
  }
}

export class UserFavoriteRecordDTO extends PaginationResponsesDto<UserFavoriteRecordItemDTO> {
  @ApiProperty({
    type: [UserFavoriteRecordItemDTO],
    description: '찜한 소품샵 리스트',
  })
  data: UserFavoriteRecordItemDTO[];

  @ApiProperty({
    type: PageInfoDTO,
    description: '페이지네이션 정보',
  })
  pageInfo: PageInfoDTO;
}
