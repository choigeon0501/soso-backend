import { ApiProperty } from '@nestjs/swagger';

export class SubmissionBaseResponseDto {
  @ApiProperty({
    description: 'Submission ID',
    example: 30,
  })
  id: number;

  @ApiProperty({
    description: '제출 타입',
    example: 'new_shop',
    enum: ['new_shop', 'new_product', 'new_operating'],
  })
  type: 'new_shop' | 'new_product' | 'new_operating';

  @ApiProperty({
    description: '처리 상태',
    example: 'pending',
    enum: ['pending', 'approved', 'rejected'],
  })
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: '반려 사유',
    example: null,
    nullable: true,
  })
  rejectMessage: string | null;

  @ApiProperty({
    description: '제출 일자',
    example: '2025-12-31T05:09:41.874Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}

export class SubmissionUserResponseDto {
  @ApiProperty({
    description: '사용자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    nullable: true,
  })
  profileImg: string | null;

  @ApiProperty({
    description: '닉네임',
    example: '소소한유저',
  })
  nickName: string;

  @ApiProperty({
    description: '마지막 활동 일시',
    example: '2025-12-30T02:40:06.000Z',
    type: String,
    format: 'date-time',
  })
  lastActivityAt: Date;

  @ApiProperty({
    description: '회원 가입일',
    example: '2025-11-06T02:37:50.106Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: '정보 수정 일자',
    example: '2025-12-31T05:09:26.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

export class SubmissionProductResponseDto {
  @ApiProperty({
    description: '상품 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '상품명',
    example: '스티커',
  })
  name: string;
}

export class SubmissionShopProductMappingResponseDto {
  @ApiProperty({
    description: 'ShopProductMapping ID',
    example: 2357,
  })
  id: number;

  @ApiProperty({
    description: '검증 여부 (0: 미검증, 1: 검증)',
    example: 0,
  })
  isVerified: boolean;

  @ApiProperty({
    description: '생성 일자',
    example: '2025-12-31T05:09:59.804Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일자',
    example: '2025-12-31T05:09:59.804Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '상품 정보',
    type: SubmissionProductResponseDto,
  })
  product: SubmissionProductResponseDto;
}

export class SubmissionShopOperatingHourResponseDto {
  @ApiProperty({
    description: '운영시간 ID',
    example: 1309,
  })
  id: number;

  @ApiProperty({
    description: '검증 여부 (0: 미검증, 1: 검증)',
    example: 0,
  })
  isVerified: boolean;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: '운영 요일',
    example: ['Monday', 'Tuesday', 'Friday'],
    isArray: true,
  })
  daysOfWeek: string[];

  @ApiProperty({
    description: '영업 시작 시간',
    example: '09:00:00',
  })
  startTime: string;

  @ApiProperty({
    description: '영업 종료 시간',
    example: '18:00:00',
  })
  endTime: string;
}

export class SubmissionShopBaseResponseDto {
  @ApiProperty({ example: 650 })
  id: number;

  @ApiProperty({ example: '소소한 상점' })
  name: string;

  @ApiProperty({
    description: '대표 이미지 URL',
    example: null,
    nullable: true,
  })
  mainImage: string | null;

  @ApiProperty({
    description: '검증 여부 (0: 미검증, 1: 검증)',
    example: 0,
  })
  isVerified: boolean;

  @ApiProperty({
    description: '인스타그램 URL',
    example: 'https://www.instagram.com/example',
    nullable: true,
  })
  instagram: string | null;

  @ApiProperty({ example: 37.123456 })
  lat: number;

  @ApiProperty({ example: 127.123456 })
  lng: number;

  @ApiProperty({
    description: '소품샵 위치',
    example: '서울시 성동구 어딘가 123-4',
  })
  location: string;

  @ApiProperty({
    description: '숨김 여부',
    example: false,
  })
  isHidden: boolean;

  @ApiProperty({
    description: '생성 일자',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일자',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

export class SubmissionShopResponseDto extends SubmissionShopBaseResponseDto {
  @ApiProperty({
    description: '운영 시간 목록 (신규 소품샵 등록 시)',
    type: SubmissionShopOperatingHourResponseDto,
    isArray: true,
    required: false,
  })
  operatingHours?: SubmissionShopOperatingHourResponseDto[];

  @ApiProperty({
    description: '상품 매핑 목록 (상품 추가 요청 시)',
    type: SubmissionShopProductMappingResponseDto,
    isArray: true,
    required: false,
  })
  productMappings?: SubmissionShopProductMappingResponseDto[];
}

export class NewShopSubmissionResponseDto extends SubmissionBaseResponseDto {
  @ApiProperty({
    description: '소품샵 기본 정보',
    type: SubmissionShopBaseResponseDto,
  })
  shop: SubmissionShopBaseResponseDto;

  @ApiProperty({
    description: '이번 제보에 포함된 운영시간 (단일)',
    type: SubmissionShopOperatingHourResponseDto,
    nullable: true,
  })
  shopOperatingHour: SubmissionShopOperatingHourResponseDto | null;

  @ApiProperty({
    description: '이번 제보에 포함된 상품 목록',
    type: SubmissionProductResponseDto,
    isArray: true,
  })
  shopProducts: SubmissionProductResponseDto[];

  @ApiProperty({ type: SubmissionUserResponseDto })
  user: SubmissionUserResponseDto;
}

export class NewProductSubmissionResponseDto extends SubmissionBaseResponseDto {
  @ApiProperty({
    description: '소품샵 기본 정보',
    type: SubmissionShopBaseResponseDto,
  })
  shop: SubmissionShopBaseResponseDto;

  @ApiProperty({
    description: '현재 검증된 상품 목록 (product만)',
    type: SubmissionProductResponseDto,
    isArray: true,
  })
  shopProducts: SubmissionProductResponseDto[];

  @ApiProperty({
    description: '이번 요청으로 추가된 상품 목록 (product만)',
    type: SubmissionProductResponseDto,
    isArray: true,
  })
  newShopProducts: SubmissionProductResponseDto[];

  @ApiProperty({ type: SubmissionUserResponseDto })
  user: SubmissionUserResponseDto;
}

export class NewOperatingSubmissionResponseDto extends SubmissionBaseResponseDto {
  @ApiProperty({
    description: '소품샵 기본 정보',
    type: SubmissionShopBaseResponseDto,
  })
  shop: SubmissionShopBaseResponseDto;

  @ApiProperty({
    description: '현재 검증된 운영시간 (isVerified=1인 단일)',
    type: SubmissionShopOperatingHourResponseDto,
    nullable: true,
  })
  shopOperatingHour: SubmissionShopOperatingHourResponseDto | null;

  @ApiProperty({
    description: '이번 요청으로 추가된 운영시간',
    type: SubmissionShopOperatingHourResponseDto,
  })
  newShopOperatingHour: SubmissionShopOperatingHourResponseDto;

  @ApiProperty({ type: SubmissionUserResponseDto })
  user: SubmissionUserResponseDto;
}

export class GetAllSubmissionsForAdminResponseDto {
  @ApiProperty({
    description: '신규 소품샵 등록 요청 목록',
    type: NewShopSubmissionResponseDto,
    isArray: true,
  })
  newShopSubmissions: NewShopSubmissionResponseDto[];

  @ApiProperty({
    description: '신규 상품 추가 요청 목록',
    type: NewProductSubmissionResponseDto,
    isArray: true,
  })
  newProductSubmissions: NewProductSubmissionResponseDto[];

  @ApiProperty({
    description: '신규 운영시간 추가 요청 목록',
    type: NewOperatingSubmissionResponseDto,
    isArray: true,
  })
  newOperatingSubmissions: NewOperatingSubmissionResponseDto[];
}
