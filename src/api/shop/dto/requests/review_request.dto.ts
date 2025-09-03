import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PostReviewDto {
  @ApiProperty({ description: '리뷰 내용', example: '정말 예쁜 소품들이 많아요!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'PreSigned로 업로드한 이미지 Key들 (최대 10개)',
    type: String,
    isArray: true,
    example: ['rev/img/1.png', 'rev/img/2.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reviewImgKeys?: string[];
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: '수정할 리뷰 내용 (최대 100자)', example: '너무 예뻐서 또 방문하고 싶어요!', maxLength: 100 })
  @MaxLength(100)
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: '삭제할 이미지 ID 배열',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  deleteImages?: number[];

  @ApiPropertyOptional({
    description: '새로 업로드할 이미지 키 배열 (최대 10개)',
    type: String,
    isArray: true,
  })
  newImageKeys?: string[];
}

export class PresignPutRequestDto {
  @ApiProperty({ description: '원본 파일명', example: 'profile.png' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({
    description: 'MIME 타입',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
    example: 'image/png',
  })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}

export class PresignPutListRequestDto {
  @ApiProperty({ type: [PresignPutRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignPutRequestDto)
  files: PresignPutRequestDto[];
}
