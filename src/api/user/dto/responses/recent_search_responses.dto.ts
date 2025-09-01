import { ApiProperty } from '@nestjs/swagger';
import { RecentSearch } from '../../../../database/entity/recent-search.entity';

export class Recent_search_responsesDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: '소소한 상점' }) shopName: string;
  @ApiProperty({ example: 42 }) shopId: number;

  constructor(init: Partial<Recent_search_responsesDto>) {
    Object.assign(this, init);
  }

  static fromEntities(entities: RecentSearch[]): Recent_search_responsesDto[] {
    return entities.map((e) => new Recent_search_responsesDto({ id: e.id, shopName: e.shop.name, shopId: e.shop.id }));
  }
}
