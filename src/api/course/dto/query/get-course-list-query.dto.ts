import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CourseListStatusFilter } from '../../const/course-status.const';

export class GetCourseListQueryDto {
  @ApiPropertyOptional({
    description: '상태 필터',
    enum: ['in_progress', 'completed', 'all'],
    example: 'all',
    default: 'all',
  })
  @IsOptional()
  @IsIn(['in_progress', 'completed', 'all'])
  status?: CourseListStatusFilter = 'all';

  @ApiPropertyOptional({ description: '페이지 번호 (1부터)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
