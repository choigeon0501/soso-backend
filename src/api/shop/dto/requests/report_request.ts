import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ReviewReportType } from '../../../review/const/review-report-type.const';
import { ShopReportType } from '../../const/shop-report-type.const';

export class ShopReportDto {
  @ApiProperty({
    description: '신고 상태 코드',
    example: 'closed',
  })
  @IsNotEmpty()
  @IsEnum(ShopReportType)
  reportType: ShopReportType;

  @ApiPropertyOptional({
    description: '신고 사유 메시지 (선택 사항, 최대 100자)',
    example: '정보가 실제와 다릅니다.',
  })
  @IsOptional()
  reportMessage?: string;
}

export class ReviewReportDto {
  @ApiProperty({
    description: '신고 상태 코드',
    example: 'irrelevant',
  })
  @IsNotEmpty()
  @IsEnum(ReviewReportType)
  reportType: ReviewReportType;

  @ApiPropertyOptional({
    description: '신고 사유 메시지 (선택 사항, 최대 100자)',
    example: '광고성 내용입니다.',
  })
  @IsOptional()
  reportMessage?: string;
}
