import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: '수정할 리뷰 내용 (최대 100자)', example: '너무 예뻐서 또 방문하고 싶어요!', maxLength: 100 })
  @MaxLength(100)
  @IsOptional()
  content?: string;

  /**
   * multipart라 `deleteReviewImages=5&deleteReviewImages=6`(배열)과 `deleteReviewImages=5,6`(문자열) 두 형태로 온다.
   */
  @ApiPropertyOptional({ description: '삭제할 이미지 ID 배열', example: [1, 2], type: [Number] })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => Number(v));
    return value.split(',').map((v) => Number(v));
  })
  @IsArray()
  @IsNumber({}, { each: true })
  deleteReviewImages?: number[];
}
