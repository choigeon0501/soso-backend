import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class GetUserFavoritesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '지역 필터링 지역 id', example: 1 })
  @IsOptional()
  @Type(() => Number)
  areaId?: number;
}
