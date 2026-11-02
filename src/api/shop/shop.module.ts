import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopController } from './shop.controller';
import { ShopService } from './services/shop.service';
import { ShopSubmitService } from './services/shop-submit.service';
import { ShopSubmitTransactionService } from './services/shop-submit-transaction.service';
import { RecentSearchService } from './services/recent-search.service';
import { ShopRepository } from './repositories/shop.repository';
import { ShopSubmitRepository } from './repositories/shop-submit.repository';
import { RecentSearchRepository } from './repositories/recent-search.repository';
import { ShopReportRepository } from './repositories/shop-report.repository';
import { Shop } from './entities/shop.entity';
import { ShopSubmitRecord } from './entities/shop-submit-user-record.entity';
import { RecentSearch } from './entities/shop-recent-search.entity';
import { ShopReport } from './entities/shop-report.entity';
import { UserModule } from '../user/user.module';
import { ReviewModule } from '../review/review.module';
import { RegionModule } from '../region/region.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, ShopSubmitRecord, RecentSearch, ShopReport]),
    forwardRef(() => UserModule),
    forwardRef(() => ReviewModule),
    RegionModule,
  ],
  exports: [ShopService, ShopSubmitService, RecentSearchService],
  controllers: [ShopController],
  providers: [
    ShopService,
    ShopSubmitService,
    ShopSubmitTransactionService,
    RecentSearchService,
    ShopRepository,
    ShopSubmitRepository,
    RecentSearchRepository,
    ShopReportRepository,
  ],
})
export class ShopModule {}
