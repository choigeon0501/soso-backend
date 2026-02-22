import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Paging, ResponsePageNationDTO } from './pagination_response.dto';

export class ShopWithin1KmResponseItemDTO {
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

export class ShopSearchResultItemDTO {
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

export class ShopSearchPageNationResultDTO extends ResponsePageNationDTO<ShopSearchResultItemDTO> {
  @ApiProperty({ type: [ShopSearchResultItemDTO] })
  data: ShopSearchResultItemDTO[];

  @ApiProperty({ type: Paging })
  pageInfo: Paging;
}

export class ProductSimpleDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '인테리어 소품' })
  name: string;
}

export class OperatingHourDTO {
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

export class ShopDetailDTO {
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

  @ApiProperty({ type: [OperatingHourDTO] })
  operatingHours: OperatingHourDTO[];

  @ApiProperty({ type: [ProductSimpleDTO] })
  products: ProductSimpleDTO[];
}

export class ReviewUserDTO {
  @ApiProperty({ example: 'https://example.com/photo.jpg', nullable: true })
  photoUrl?: string;

  @ApiProperty({ example: '소소한유저' })
  nickName: string;
}

export class ReviewWithUserDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: () => ReviewUserDTO })
  user: ReviewUserDTO;
}

export class ShopDetailResponseDTO {
  @ApiProperty({ type: ShopDetailDTO })
  shop: ShopDetailDTO;

  @ApiProperty({ type: [ReviewWithUserDTO] })
  userReviews: ReviewWithUserDTO[];

  @ApiProperty({ type: [ReviewWithUserDTO] })
  otherReviews: ReviewWithUserDTO[];

  @ApiProperty({ example: true })
  wishlist: boolean;

  @ApiProperty({ type: [String] })
  imageList: string[];
}
