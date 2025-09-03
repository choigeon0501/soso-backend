import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetShopWithin1KmDTO {
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

  // 현재 1KM로 고정되어 있지만 Query에 KM도 설정할 수 있게 수정하는 방향이 좋아보임

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

export class GetSearchPageShopDTO {
  @ApiProperty({ description: '위도', example: 37.5665 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ description: '경도', example: 126.978 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lng: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  limit: number;

  @ApiProperty({ description: '페이지 번호', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  page: number;

  @ApiProperty({ description: '검색 키워드', example: '소품샵' })
  @IsString()
  @IsNotEmpty()
  keyword: string;
}
