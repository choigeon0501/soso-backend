import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewBanRepository } from './review-ban.repository';
import { ReviewBan } from '../../database/entity/review-ban.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewBan])],
  providers: [ReviewBanRepository],
  exports: [ReviewBanRepository],
})
export class ReviewBanModule {}
