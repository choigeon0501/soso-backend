import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: '리뷰 내용', example: '정말 예쁜 소품들이 많아요!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
