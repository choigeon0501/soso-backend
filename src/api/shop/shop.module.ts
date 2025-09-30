import { Module, forwardRef } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from 'src/database/entity/shop.entity';
import { ShopRepository } from './shop.repository';
import { ReviewModule } from '../review/review.module';
import { SubmitModule } from '../submit/submit.module';
import { RegionModule } from '../region/region.module';
import { RecentSearchModule } from '../recent-search/recent-search.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AwsModule } from '../aws/aws.module';
import { ReportModule } from '../report/report.module';
import { UserFavoriteModule } from '../user-favorite/user-favorite.module';
import { ReviewBanModule } from '../review-ban/review-ban.module';

@Module({
  imports: [
    forwardRef(() => SubmitModule),
    TypeOrmModule.forFeature([Shop]),
    ReviewModule,
    UserFavoriteModule,
    RegionModule,
    RecentSearchModule,
    TransactionsModule,
    AwsModule,
    ReportModule,
    ReviewBanModule,
  ],
  controllers: [ShopController],
  providers: [ShopService, ShopRepository],
  exports: [ShopRepository],
})
export class ShopModule {}
