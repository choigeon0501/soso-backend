import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsInt, Min, Max, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class PaginationQueryDTO {
  @ApiProperty({ example: 1, required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 10, required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}
