import { ApiProperty } from '@nestjs/swagger';

export class GetRegionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '서울' })
  name: string;
}
