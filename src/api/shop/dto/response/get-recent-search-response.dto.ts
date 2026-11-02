import { ApiProperty } from '@nestjs/swagger';

export class GetRecentSearchResponseDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: '소소한 상점' }) shopName: string;
  @ApiProperty({ example: 42 }) shopId: number;
}
