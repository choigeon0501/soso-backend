import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchShopsQueryDto {
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
