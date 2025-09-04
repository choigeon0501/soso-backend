import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDTO {
  @ApiProperty({ example: '소소한유저' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[^\x00-\x1F\x7F]*$/, { message: '제어 문자를 포함할 수 없습니다.' })
  @Matches(/^(?!.*(<script|<\/script>|<iframe|on\w+=|javascript:|eval\()).*$/i, { message: '스크립트 또는 악성 코드를 포함할 수 없습니다.' })
  @Matches(/^[A-Za-z0-9가-힣 _-]{2,20}$/, { message: '닉네임은 2~20자' })
  nickName?: string | null;

  @ApiProperty({ example: '이미지 키' })
  @IsOptional()
  profileImgKey?: string | null;
}
