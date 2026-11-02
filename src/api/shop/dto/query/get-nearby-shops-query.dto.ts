import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetNearbyShopsQueryDto {
  @ApiProperty({ description: '위도', example: 37.5665 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ description: '경도', example: 127 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lng: number;

  @ApiProperty({ description: '정렬 방식 (true: 거리순, false: 인기순)', example: true })
  @IsBoolean()
  @IsNotEmpty()
  @Type(() => Boolean)
  sorting: boolean;

  @ApiPropertyOptional({ description: '위시리스트 필터링', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isWishlist?: boolean;

  @ApiPropertyOptional({ description: '상품 ID 배열로 필터링', example: [1, 2, 3], type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  productIds?: number[];
}
