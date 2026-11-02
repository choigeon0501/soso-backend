import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ProductIdDto {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @IsNumber()
  id: number;
}
