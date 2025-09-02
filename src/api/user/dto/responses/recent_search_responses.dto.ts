import { ApiProperty } from '@nestjs/swagger';
import { RecentSearch } from '../../../../database/entity/recent-search.entity';

export class RecentSearchResponsesDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: '소소한 상점' }) shopName: string;
  @ApiProperty({ example: 42 }) shopId: number;

  constructor(init: Partial<RecentSearchResponsesDto>) {
    Object.assign(this, init);
  }

  static fromEntities(entities: RecentSearch[]): RecentSearchResponsesDto[] {
    return entities.map((e) => new RecentSearchResponsesDto({ id: e.id, shopName: e.shop.name, shopId: e.shop.id }));
  }
}
