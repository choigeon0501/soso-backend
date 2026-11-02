import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { SortOrder } from '../../../../common/const/sort-order.const';

export class GetMyReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SortOrder, default: 'DESC', required: true })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase?.() ?? value)
  @IsEnum(SortOrder)
  sort: SortOrder;
}
