import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({ example: '소소한유저' })
  @IsOptional()
  nickName?: string | null;

  @ApiProperty({ example: '이미지 키' })
  @IsOptional()
  profileImgKey?: string | null;
}
