import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { WithdrawalReasonCode } from '../../const/user-withdrawal-response-code.const.dt';

export class WithdrawalReasonDTO {
  @ApiProperty({ description: '회원 탈퇴 이유', enum: WithdrawalReasonCode })
  @IsNotEmpty()
  @IsEnum(WithdrawalReasonCode)
  withdrawalReasonCode: WithdrawalReasonCode;

  @ApiProperty({ description: '회원 탈퇴 이유 (기타) 메시지' })
  @IsEmpty()
  @IsString()
  withdrawalReasonText: string;
}

export class ValidateNickNameDTO {
  @ApiProperty({ example: '소소한유저' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[^\x00-\x1F\x7F]*$/, { message: '제어 문자를 포함할 수 없습니다.' })
  @Matches(/^(?!.*(<script|<\/script>|<iframe|on\w+=|javascript:|eval\()).*$/i, { message: '스크립트 또는 악성 코드를 포함할 수 없습니다.' })
  @Matches(/^[A-Za-z0-9가-힣 _-]{2,20}$/, { message: '닉네임은 2~20자' })
  nickName: string;
}
