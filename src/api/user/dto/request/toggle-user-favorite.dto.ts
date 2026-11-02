import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ToggleUserFavoriteDto {
  @ApiProperty({ description: '소품샵 ID', example: 42 })
  @IsNumber()
  @IsNotEmpty()
  shopId: number;
}
