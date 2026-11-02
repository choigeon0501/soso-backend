import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WithdrawalReasonCode } from '../../const/withdrawal-reason-code.const';

export class WithdrawUserQueryDto {
  @ApiProperty({ description: '회원 탈퇴 이유', enum: WithdrawalReasonCode })
  @IsNotEmpty()
  @IsEnum(WithdrawalReasonCode)
  withdrawalReasonCode: WithdrawalReasonCode;
}
