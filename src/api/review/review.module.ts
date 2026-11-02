import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './services/review.service';
import { ReviewTransactionService } from './services/review-transaction.service';
import { ReviewRepository } from './repositories/review.repository';
import { ReviewBanRepository } from './repositories/review-ban.repository';
import { ReviewReportRepository } from './repositories/review-report.repository';
import { Review } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { ReviewBan } from './entities/review-ban.entity';
import { ReviewReport } from './entities/review-report.entity';
import { AwsModule } from '../../common/aws/aws.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewImage, ReviewBan, ReviewReport]), AwsModule, forwardRef(() => ShopModule)],
  exports: [ReviewService],
  providers: [ReviewService, ReviewTransactionService, ReviewRepository, ReviewBanRepository, ReviewReportRepository],
})
export class ReviewModule {}
