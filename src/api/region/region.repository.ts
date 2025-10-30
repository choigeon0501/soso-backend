import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Region } from 'src/api/region/entities/region.entity';

import { Repository } from 'typeorm';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class RegionRepository {
  constructor(
    @InjectRepository(Region)
    private regionRepository: Repository<Region>,
    private readonly loggerService: LoggerService,
  ) {}

  async findRegionByLocation(location: string) {
    try {
      const regionName = location[0] + location[1];
      return await this.regionRepository.findOne({
        where: {
          name: regionName,
        },
      });
    } catch (err) {
      this.loggerService.warn(`Region/ findRegionByLocation Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllRegions() {
    try {
      return await this.regionRepository.find();
    } catch (err) {
      this.loggerService.warn(`Region/ findAllRegions Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
