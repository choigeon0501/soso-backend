import { ApiProperty } from '@nestjs/swagger';

export class GetAllFeedbacksResponseDto {
  @ApiProperty({
    example: 1,
    description: '피드백 순번',
  })
  num: number;

  @ApiProperty({
    example: 'user@example.com',
    description: '피드백 작성자 이메일',
  })
  email: string;

  @ApiProperty({
    example: '서비스가 정말 좋아요!',
    description: '피드백 내용',
  })
  feedback: string;

  @ApiProperty({
    example: '2026-01-13T10:15:30.000Z',
    description: '피드백 생성일',
  })
  createdAt: Date;
}
