import { ApiProperty } from '@nestjs/swagger';
import { PageInfoDto } from '../../../../common/dto/page-info.dto';

export class SearchShopItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Green Valley Market' })
  name: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  mainImage: string | null;

  @ApiProperty({ example: '서울시 강남구' })
  location: string;

  @ApiProperty({ example: 37.5665 })
  lat: number;

  @ApiProperty({ example: 126.978 })
  lng: number;

  @ApiProperty({ example: 0.42, description: '거리 (단위: km)' })
  distance: number;
}

export class SearchShopsResponseDto {
  @ApiProperty({ type: [SearchShopItemResponseDto] })
  data: SearchShopItemResponseDto[];

  @ApiProperty({ type: PageInfoDto })
  pageInfo: PageInfoDto;
}
