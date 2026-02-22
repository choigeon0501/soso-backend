import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveFeedbackDTO {
  @ApiProperty({
    description: '피드백 내용',
    example: '앱 사용 중 UI가 약간 불편했어요.',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  feedback: string;
}
