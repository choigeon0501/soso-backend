import { ApiProperty } from '@nestjs/swagger';

export class ShareCourseResponseDto {
  @ApiProperty({ description: '공유 토큰 (URL에 쓰일 32자 문자열)', example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' })
  shareToken: string;
}

export class UploadShareOgImageResponseDto {
  @ApiProperty({ description: '업로드된 OG 이미지 public URL', example: 'https://bucket.s3.ap-northeast-2.amazonaws.com/course-share-og/1714984000-snapshot.jpg' })
  ogImageUrl: string;
}

export class ImportCourseResponseDto {
  @ApiProperty({ description: '새로 생성된 내 코스의 id', example: 42 })
  courseId: number;
}

class SharedShopDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: '우들곳' })
  name: string;

  @ApiProperty({ example: 'https://.../main.jpg', nullable: true })
  mainImage: string | null;

  @ApiProperty({ example: 37.5445 })
  lat: number;

  @ApiProperty({ example: 127.0553 })
  lng: number;

  @ApiProperty({ example: 'https://instagram.com/shop', nullable: true })
  instagram: string | null;
}

class SharedStopDto {
  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiProperty({ type: () => SharedShopDto })
  shop: SharedShopDto;
}

export class SharedCourseResponseDto {
  @ApiProperty({ example: '성수동 데이트 코스' })
  name: string;

  @ApiProperty({ description: '코스 소유자 닉네임', example: 'tester', nullable: true })
  ownerNickname: string | null;

  @ApiProperty({ description: '코스 소유자 프로필 이미지', example: 'https://.../profile.jpg', nullable: true })
  ownerProfileImg: string | null;

  @ApiProperty({ description: '공유 페이지 OG 이미지 (지도 스냅샷)', example: 'https://.../snapshot.jpg', nullable: true })
  ogImageUrl: string | null;

  @ApiProperty({ description: '공유된 stop 개수', example: 3 })
  totalStops: number;

  @ApiProperty({ type: [SharedStopDto] })
  stops: SharedStopDto[];
}
