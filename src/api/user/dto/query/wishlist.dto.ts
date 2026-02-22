import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDTO } from './pagination.dto';

export class UserFavoritePageNationDTO extends PaginationQueryDTO {
  @ApiPropertyOptional({ description: '지역 필터링 지역 id', example: 1 })
  @IsOptional()
  @Type(() => Number)
  areaId?: number;
}
