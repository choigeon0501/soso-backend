import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleReviewHiddenDto {
  @ApiProperty({
    description: '리뷰 숨김 여부',
    example: true,
  })
  @IsBoolean()
  isHidden: boolean;
}
