import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class GetSubmissionsQueryDto {
  @ApiPropertyOptional({
    description: '소품샵: shop, 운영정보: operate, 판매목록: product',
    example: 'shop',
    enum: ['shop', 'operate', 'product'],
    default: 'shop',
  })
  @IsOptional()
  @IsIn(['shop', 'operate', 'product'])
  type?: 'shop' | 'operate' | 'product' = 'shop';

  @ApiPropertyOptional({
    description: '정렬 기준 (가입일 순: created)',
    example: 'created',
    enum: ['created'],
    default: 'created',
  })
  @IsOptional()
  @IsIn(['created'])
  sortBy?: 'created' = 'created';

  @ApiPropertyOptional({
    description: '최신순: desc, 오래된 순: asc',
    example: 'desc',
    enum: ['desc', 'asc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['desc', 'asc'])
  order?: 'desc' | 'asc' = 'desc';
}
