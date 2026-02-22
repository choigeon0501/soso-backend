import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDTO } from './pagination.dto';
import { SortOrder } from '../../../../common/enum/sorting.enum';

export class ReviewPaginationDTO extends PaginationQueryDTO {
  @ApiPropertyOptional({ enum: SortOrder, default: 'DESC', required: true })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase?.() ?? value)
  @IsEnum(SortOrder)
  sort: SortOrder;
}
