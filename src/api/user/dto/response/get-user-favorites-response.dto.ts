import { ApiProperty } from '@nestjs/swagger';
import { PageInfoDto } from '../../../../common/dto/page-info.dto';

export class UserFavoriteShopResponseDto {
  @ApiProperty({ description: '소품샵 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '소품샵 이름', example: '카페포 옹' })
  name: string;

  @ApiProperty({ description: '대표 이미지 URL', example: 'https://example.com/image.jpg', nullable: true })
  mainImage: string | null;
}

export class UserFavoriteItemResponseDto {
  @ApiProperty({ description: '찜 기록 ID', example: 15 })
  id: number;

  @ApiProperty({ description: '생성일', example: '2025-08-02T06:11:18.498Z' })
  createdAt: Date;

  @ApiProperty({ type: UserFavoriteShopResponseDto, description: '소품샵 정보' })
  shop: UserFavoriteShopResponseDto;
}

export class GetUserFavoritesResponseDto {
  @ApiProperty({ type: [UserFavoriteItemResponseDto], description: '찜한 소품샵 리스트' })
  data: UserFavoriteItemResponseDto[];

  @ApiProperty({ type: PageInfoDto, description: '페이지네이션 정보' })
  pageInfo: PageInfoDto;
}
