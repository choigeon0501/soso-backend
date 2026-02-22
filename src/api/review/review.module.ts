import { Module } from '@nestjs/common';
import { Review } from 'src/api/review/entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewRepository } from './repositories/review.repository';
import { AwsModule } from '../../common/aws/aws.module';
import { ReviewImage } from 'src/api/review/entities/review-image.entity';
import { ReviewService } from './review.service';
import { ReviewBan } from './entities/review-ban.entity';
import { ReviewBanRepository } from './repositories/review-ban.repository';
import { ReviewReportRepository } from './repositories/review-report.repository';
import { ReviewReport } from './entities/review-report.entity';
import { ReviewTransactionsRepository } from './repositories/review-transactions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewImage, ReviewBan, ReviewReport]), AwsModule],
  providers: [ReviewService, ReviewRepository, ReviewBanRepository, ReviewReportRepository, ReviewTransactionsRepository],
  exports: [ReviewService, ReviewRepository, ReviewBanRepository, ReviewReportRepository, ReviewTransactionsRepository],
})
export class ReviewModule {}
