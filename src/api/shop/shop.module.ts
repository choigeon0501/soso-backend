import { Module, forwardRef } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from 'src/database/entity/shop.entity';
import { ShopRepository } from './repositories/shop.repository';
import { ReviewModule } from '../review/review.module';
import { RegionModule } from '../region/region.module';
import { AwsModule } from '../../common/aws/aws.module';
import { UserModule } from '../user/user.module';
import { ShopSubmitRepository } from './repositories/shop-submit.repository';
import { SubmitUserRecord } from '../../database/entity/submit-user-record.entity';
import { RecentSearch } from '../../database/entity/recent-search.entity';
import { ShopRecentSearchRepository } from './repositories/shop-recent-search.repository';
import { ShopReport } from '../../database/entity/shop-report.entity';
import { ShopReportRepository } from './repositories/shop-report.repository';
import { ShopSubmitTransactionsRepository } from './repositories/shop-submit-transactions.repository';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([Shop, SubmitUserRecord, RecentSearch, ShopReport]),
    ReviewModule,
    RegionModule,
    AwsModule,
  ],
  controllers: [ShopController],
  providers: [ShopService, ShopRepository, ShopSubmitRepository, ShopRecentSearchRepository, ShopReportRepository, ShopSubmitTransactionsRepository],
  exports: [ShopService, ShopRepository, ShopSubmitRepository, ShopRecentSearchRepository, ShopReportRepository, ShopSubmitTransactionsRepository],
})
export class ShopModule {}
