import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OperatingHoursDto } from './operating-hours.dto';
import { ProductIdDto } from './product-id.dto';

export class SubmitShopInfoDto {
  @ApiProperty({ description: '소품샵 이름', example: '소소한 상점' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '위도 (Kakao 좌표 y)', example: 37.123456 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: '경도 (Kakao 좌표 x)', example: 127.123456 })
  @IsNumber()
  lng: number;

  @ApiProperty({
    description: '표시용 주소. Kakao road_address_name(도로명) 우선, 없으면 address_name(지번)',
    example: '서울 성동구 왕십리로 123',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description:
      'Kakao 주소 응답의 region_1depth_name(시/도). 지역(region) 매칭에 사용. "서울특별시"·"서울"·"충청남도"·"충남" 등 축약형/전체명 모두 허용',
    example: '충청남도',
  })
  @IsString()
  @IsNotEmpty()
  region1DepthName: string;
}

export class SubmitNewShopDto {
  @ApiProperty({ description: '소품샵 정보', type: SubmitShopInfoDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SubmitShopInfoDto)
  shop: SubmitShopInfoDto;

  @ApiPropertyOptional({ description: '운영 시간 정보', type: OperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;

  @ApiPropertyOptional({ description: '판매 제품 리스트', type: [ProductIdDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductIdDto)
  products?: ProductIdDto[];
}
