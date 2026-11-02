import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class OperatingHoursDto {
  @ApiPropertyOptional({ description: '연락처', example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: '시작 시간 (HH:mm)', example: '09:00' })
  @IsOptional()
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ description: '종료 시간 (HH:mm)', example: '18:00' })
  @IsOptional()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({
    description: '운영 요일',
    example: ['Monday', 'Tuesday', 'Friday'],
    isArray: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  @IsOptional()
  @IsEnum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], { each: true })
  daysOfWeek?: string[];
}
