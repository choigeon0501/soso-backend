import { ApiProperty } from '@nestjs/swagger';

export class ShopRegionDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '서울' })
  name: string;
}
