import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleShopHiddenDto {
  @ApiProperty({
    example: true,
    description: '소품샵 숨김 여부 (true: 유저에게 숨김, false: 다시 노출)',
  })
  @IsBoolean()
  @IsNotEmpty()
  isHidden: boolean;
}
