import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ReviewReportType } from '../../const/review-report-type.const';

export class ReportReviewDto {
  @ApiProperty({ description: '신고 상태 코드', example: 'irrelevant' })
  @IsNotEmpty()
  @IsEnum(ReviewReportType)
  reportType: ReviewReportType;

  @ApiPropertyOptional({ description: '신고 사유 메시지 (선택 사항, 최대 100자)', example: '광고성 내용입니다.' })
  @IsOptional()
  reportMessage?: string;
}
