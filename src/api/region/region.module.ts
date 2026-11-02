import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from './entities/region.entity';
import { RegionRepository } from './repositories/region.repository';
import { RegionController } from './region.controller';
import { RegionService } from './region.service';

@Module({
  imports: [TypeOrmModule.forFeature([Region])],
  exports: [RegionService],
  controllers: [RegionController],
  providers: [RegionService, RegionRepository],
})
export class RegionModule {}
