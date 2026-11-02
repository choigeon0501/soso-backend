import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { OperatingHoursDto } from './operating-hours.dto';

export class SubmitShopOperatingHoursDto {
  @ApiProperty({ description: '운영 시간 정보' })
  @IsNotEmpty()
  operatingHours: OperatingHoursDto;
}
