import { ApiProperty } from '@nestjs/swagger';

export class StampResponseDto {
  @ApiProperty({ example: '2026-04-20T10:00:00.000Z' })
  visitedAt: Date;

  @ApiProperty({ example: 50 })
  progress: number;

  @ApiProperty({ enum: ['in_progress', 'completed'], example: 'in_progress' })
  status: 'in_progress' | 'completed';
}

export class UnstampResponseDto {
  @ApiProperty({ example: 0 })
  progress: number;

  @ApiProperty({ enum: ['in_progress', 'completed'], example: 'in_progress' })
  status: 'in_progress' | 'completed';
}

export class CreateCourseResponseDto {
  @ApiProperty({ example: 1 })
  courseId: number;
}
