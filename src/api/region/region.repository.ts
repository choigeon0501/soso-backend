import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Region } from 'src/api/region/entities/region.entity';

import { Repository } from 'typeorm';

@Injectable()
export class RegionRepository {
  constructor(
    @InjectRepository(Region)
    private regionRepository: Repository<Region>,
  ) {}

  async findRegionByName(name: string) {
    return await this.regionRepository.findOne({
      where: {
        name,
      },
    });
  }

  async findAllRegions() {
    return await this.regionRepository.find();
  }
}
