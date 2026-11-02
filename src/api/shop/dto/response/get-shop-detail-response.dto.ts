import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShopDetailProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '인테리어 소품' })
  name: string;
}

export class ShopDetailOperatingHourResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 0, description: '0: 확인 완료된 정보, 1: 확인이 필요한 정보' })
  type: number;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  phoneNumber?: string;

  @ApiProperty({ example: true })
  monday: boolean;

  @ApiProperty({ example: true })
  tuesday: boolean;

  @ApiProperty({ example: true })
  wednesday: boolean;

  @ApiProperty({ example: true })
  thursday: boolean;

  @ApiProperty({ example: true })
  friday: boolean;

  @ApiProperty({ example: true })
  saturday: boolean;

  @ApiProperty({ example: true })
  sunday: boolean;

  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '18:00' })
  endTime: string;
}

export class ShopDetailShopResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Green Valley Market' })
  name: string;

  @ApiProperty({ example: 37.5665 })
  lat: number;

  @ApiProperty({ example: 126.978 })
  lng: number;

  @ApiProperty({ example: '서울시 강남구' })
  location: string;

  @ApiProperty({ example: '@greenvalley' })
  instagramId: string;

  @ApiProperty({ type: [ShopDetailOperatingHourResponseDto] })
  operatingHours: ShopDetailOperatingHourResponseDto[];

  @ApiProperty({ type: [ShopDetailProductResponseDto] })
  products: ShopDetailProductResponseDto[];
}

export class ShopDetailReviewUserResponseDto {
  @ApiProperty({ example: 'https://example.com/photo.jpg', nullable: true })
  photoUrl?: string;

  @ApiProperty({ example: '소소한유저' })
  nickName: string;
}

export class ShopDetailReviewResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: () => ShopDetailReviewUserResponseDto })
  user: ShopDetailReviewUserResponseDto;
}

export class GetShopDetailResponseDto {
  @ApiProperty({ type: ShopDetailShopResponseDto })
  shop: ShopDetailShopResponseDto;

  @ApiProperty({ type: [ShopDetailReviewResponseDto] })
  userReviews: ShopDetailReviewResponseDto[];

  @ApiProperty({ type: [ShopDetailReviewResponseDto] })
  otherReviews: ShopDetailReviewResponseDto[];

  @ApiProperty({ example: true })
  wishlist: boolean;

  @ApiProperty({ type: [String] })
  imageList: string[];
}
