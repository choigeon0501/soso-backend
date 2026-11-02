import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectSubmissionDto {
  @ApiProperty({
    example: '거절 이유',
    description: '거절 이유',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectMessage?: string;
}
