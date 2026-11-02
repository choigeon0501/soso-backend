import { ApiProperty } from '@nestjs/swagger';
import { PageInfoDto } from '../../../../common/dto/page-info.dto';

export class MyReviewShopResponseDto {
  @ApiProperty({ description: '소품샵 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '소품샵 이름', example: '카페포 옹' })
  name: string;

  @ApiProperty({ description: '대표 이미지 Presigned URL', example: 'https://example.com/image.jpg', nullable: true })
  mainImage: string | null;
}

export class MyReviewImageResponseDto {
  @ApiProperty({ description: '이미지 ID', example: 101 })
  id: number;

  @ApiProperty({ description: '이미지 Presigned URL', example: 'https://cdn.example.com/shops/15/reviews/101.jpg' })
  url: string;
}

export class MyReviewItemResponseDto {
  @ApiProperty({ description: '리뷰 ID', example: 15 })
  id: number;

  @ApiProperty({ description: '생성일', example: '2025-08-02T06:11:18.498Z' })
  createdAt: Date;

  @ApiProperty({ description: '리뷰 글', example: '리뷰내용~~' })
  content: string;

  @ApiProperty({ type: MyReviewShopResponseDto, description: '소품샵 정보' })
  shop: MyReviewShopResponseDto;

  @ApiProperty({ type: [MyReviewImageResponseDto], description: '리뷰에 첨부된 이미지 목록' })
  images: MyReviewImageResponseDto[];
}

export class GetMyReviewsResponseDto {
  @ApiProperty({ type: [MyReviewItemResponseDto], description: '사용자가 작성한 리뷰 리스트' })
  data: MyReviewItemResponseDto[];

  @ApiProperty({ type: PageInfoDto, description: '페이지네이션 정보' })
  pageInfo: PageInfoDto;
}
