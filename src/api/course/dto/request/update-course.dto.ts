import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: '새 코스 이름 (1~30자)', example: '새 코스 이름', maxLength: 30 })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  name?: string;

  @ApiPropertyOptional({
    description: '새 소품샵 ID 배열 (전체 교체, 순서가 새 order_index, 2~30개, 중복 불가)',
    example: [12, 24, 7],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  shopIds?: number[];
}
