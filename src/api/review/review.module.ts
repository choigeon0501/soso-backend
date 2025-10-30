import { Module } from '@nestjs/common';
import { Review } from 'src/database/entity/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewRepository } from './repositories/review.repository';
import { AwsModule } from '../../common/aws/aws.module';
import { Image } from 'src/database/entity/image.entity';
import { ReviewService } from './review.service';
import { ReviewBan } from '../../database/entity/review-ban.entity';
import { ReviewBanRepository } from './repositories/review-ban.repository';
import { ReviewReportRepository } from './repositories/review-report.repository';
import { ReviewReport } from '../../database/entity/review-report.entity';
import { ReviewTransactionsRepository } from './repositories/review-transactions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Image, ReviewBan, ReviewReport]), AwsModule],
  providers: [ReviewService, ReviewRepository, ReviewBanRepository, ReviewReportRepository, ReviewTransactionsRepository],
  exports: [ReviewService, ReviewRepository, ReviewBanRepository, ReviewReportRepository, ReviewTransactionsRepository],
})
export class ReviewModule {}
