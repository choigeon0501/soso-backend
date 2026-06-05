import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OperatingHoursDto {
  @ApiPropertyOptional({ description: '연락처', example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: '시작 시간 (HH:mm)', example: '09:00' })
  @IsOptional()
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ description: '종료 시간 (HH:mm)', example: '18:00' })
  @IsOptional()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({
    description: '운영 요일',
    example: ['Monday', 'Tuesday', 'Friday'],
    isArray: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  @IsOptional()
  @IsEnum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
    each: true,
  })
  daysOfWeek?: string[];
}

export class SubmitShopOperatingHoursDto {
  @ApiProperty({ description: '운영 시간 정보' })
  @IsNotEmpty()
  operatingHours: OperatingHoursDto;
}

export class SubmitShop {
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

export class Products {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @IsNumber()
  id: number;
}

export class SubmitNewShopDto {
  @ApiProperty({ description: '소품샵 정보', type: SubmitShop })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SubmitShop)
  shop: SubmitShop;

  @ApiPropertyOptional({ description: '운영 시간 정보', type: OperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;

  @ApiPropertyOptional({ description: '판매 제품 리스트', type: [Products] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Products)
  products?: Products[];
}

export class SubmitNewProductsDto {
  @ApiProperty({ description: '제품 리스트', type: [Products] })
  @IsNotEmpty()
  products?: Products[];
}
