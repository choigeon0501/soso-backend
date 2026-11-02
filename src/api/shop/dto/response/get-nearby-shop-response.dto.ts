import { ApiProperty } from '@nestjs/swagger';

export class GetNearbyShopResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Green Valley Market' })
  name: string;

  @ApiProperty({ example: '소품샵' })
  type: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  image: string;

  @ApiProperty({ example: 'ACTIVE' })
  reportStatus: string;

  @ApiProperty({ example: 37.5665 })
  lat: number;

  @ApiProperty({ example: 126.978 })
  lng: number;

  @ApiProperty({ example: '서울시 강남구' })
  location: string;

  @ApiProperty({ example: 3 })
  regionId: number;

  @ApiProperty({ example: 0.42, description: '거리 (단위: km)' })
  distance: number;
}
